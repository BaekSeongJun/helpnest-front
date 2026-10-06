// @owner BSJ
// 공통 API 클라이언트 (docs/10 §2.3, 04 §1). 모든 lib/api/{domain}.ts 는 apiFetch 를 경유한다.
// - 기본 경로는 상대 /api (Next.js rewrites 프록시) → Refresh 쿠키가 1st-party 로 유지
// - Access 토큰은 이 모듈 메모리에만 둔다 (localStorage·sessionStorage·일반 쿠키 금지)
// - 401 이면 /api/auth/refresh 를 한 번만 호출하고(동시 요청은 같은 Promise 공유) 원래 요청을 재시도
// 다른 모듈을 import 하지 않는다(타입 제외) — 인증 흐름을 단독으로 검증할 수 있게.

import type { AuthResponse, Member } from '@/types/auth';

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

/** 백엔드 ApiResponse 실패를 변환한 에러. message 는 사용자에게 그대로 보여줘도 된다 (08 §7) */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ---- 인증 상태 (useSyncExternalStore 로 구독) ----

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthSnapshot {
  status: AuthStatus;
  member: Member | null;
}

/** 서버 렌더·첫 하이드레이션 값. 세션 복원(refresh) 전까지는 loading */
export const INITIAL_AUTH_SNAPSHOT: AuthSnapshot = { status: 'loading', member: null };

let accessToken: string | null = null;
let snapshot: AuthSnapshot = INITIAL_AUTH_SNAPSHOT;
const listeners = new Set<() => void>();

function publish(next: AuthSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

/** STOMP CONNECT 헤더용 (docs/02 §6). 연결 시점마다 호출하고 캡처하지 않는다 — 만료 후 재연결이 실패한다 */
export function getAccessToken(): string | null {
  return accessToken;
}

export function setSession(auth: AuthResponse): void {
  accessToken = auth.accessToken;
  publish({ status: 'authenticated', member: auth.member });
}

/** 내 정보가 바뀌었을 때(상담 가능 토글 등) 토큰은 그대로 두고 회원만 교체 */
export function updateSessionMember(member: Member): void {
  if (snapshot.status === 'authenticated') publish({ status: 'authenticated', member });
}

export function clearSession(): void {
  accessToken = null;
  publish({ status: 'anonymous', member: null });
}

// ---- 비회원 Guest 토큰 (CU-05 → CU-07). 메모리만 — 새로고침하면 다시 조회해야 한다 ----

let guestToken: string | null = null;
let guestTicketId: number | null = null;

/** 회원 세션이 없을 때만 Authorization 에 쓰인다. 티켓 1건 한정 (JwtProvider.guestTicketId) */
export function setGuestSession(token: string, ticketId: number): void {
  guestToken = token;
  guestTicketId = ticketId;
}

export function clearGuestSession(): void {
  guestToken = null;
  guestTicketId = null;
}

/** Guest 토큰으로 볼 수 있는 티켓 id. 없으면 null */
export function getGuestTicketId(): number | null {
  return guestTicketId;
}

let refreshing: Promise<boolean> | null = null;

/**
 * Refresh 쿠키로 Access 재발급. 동시에 여러 번 불려도 요청은 1번만 나간다.
 * 앱 시작 시 세션 복원(새로고침)과 401 재시도에 쓴다. 실패하면 비로그인 상태로 전환.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
      const body = (await res.json().catch(() => null)) as ApiEnvelope<AuthResponse> | null;
      if (!res.ok || !body?.data) {
        clearSession();
        return false;
      }
      setSession(body.data);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// ---- 요청 ----

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** 객체는 JSON 으로 직렬화, FormData 는 그대로 전송 */
  body?: unknown;
  /** 기본 상대 /api. 첨부 업로드만 백엔드 직접 호출 (02 §2.1, NEXT_PUBLIC_UPLOAD_BASE_URL) */
  baseUrl?: string;
}

function send(
  path: string,
  { body, headers, baseUrl = '/api', ...init }: RequestOptions,
): Promise<Response> {
  const h = new Headers(headers);
  const token = accessToken ?? guestToken;
  if (token) h.set('Authorization', `Bearer ${token}`);
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    h.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: h,
    body: payload,
    credentials: 'same-origin',
  });
}

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (res.ok && body?.success) return body.data as T;
  throw new ApiError(
    res.status,
    body?.error?.code ?? 'COMMON_INTERNAL_ERROR',
    body?.error?.message ?? '일시적인 오류가 발생했습니다.',
  );
}

/** 토큰 첨부 + 401 처리(Guest 만료 정리, 회원은 Refresh 1회 후 재시도)까지 끝낸 응답 */
async function request(path: string, options: RequestOptions): Promise<Response> {
  const usedGuest = !accessToken && !!guestToken;
  const res = await send(path, options);
  if (res.status !== 401) return res;
  // Guest 토큰 만료(30분)는 Refresh 로 되살릴 수 없다 — 버리고 조회 화면에서 다시 받게 한다
  if (usedGuest) {
    clearGuestSession();
    return res;
  }
  // /auth/* 의 401 은 로그인 실패·Refresh 만료 자체라 재발급 대상이 아니다
  if (!path.startsWith('/auth/') && (await refreshSession())) return send(path, options);
  return res;
}

/**
 * @param path `/api` 뒤 경로. 예: `/members/me`
 * @returns ApiResponse 의 data. 실패하면 ApiError
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return parse<T>(await request(path, options));
}

/** 파일 다운로드용. 실패 응답(JSON)은 apiFetch 와 같은 ApiError 로 */
export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const res = await request(path, options);
  if (!res.ok) await parse<never>(res);
  return res.blob();
}
