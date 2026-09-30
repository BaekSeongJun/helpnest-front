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

export function setSession(auth: AuthResponse): void {
  accessToken = auth.accessToken;
  publish({ status: 'authenticated', member: auth.member });
}

export function clearSession(): void {
  accessToken = null;
  publish({ status: 'anonymous', member: null });
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
}

function send(path: string, { body, headers, ...init }: RequestOptions): Promise<Response> {
  const h = new Headers(headers);
  if (accessToken) h.set('Authorization', `Bearer ${accessToken}`);
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    h.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }
  return fetch(`/api${path}`, { ...init, headers: h, body: payload, credentials: 'same-origin' });
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

/**
 * @param path `/api` 뒤 경로. 예: `/members/me`
 * @returns ApiResponse 의 data. 실패하면 ApiError
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options);
  // /auth/* 의 401 은 로그인 실패·Refresh 만료 자체라 재발급 대상이 아니다
  if (res.status === 401 && !path.startsWith('/auth/') && (await refreshSession())) {
    return parse<T>(await send(path, options));
  }
  return parse<T>(res);
}
