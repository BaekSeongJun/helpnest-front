// @owner BSJ
// 인증·회원 API (docs/04 §2)

import type { AuthResponse, Member } from '@/types/auth';
import { apiFetch, clearSession, setGuestSession, setSession } from './client';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const auth = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setSession(auth);
  return auth;
}

/** 서버 폐기가 실패해도(이미 만료 등) 화면은 로그아웃 상태로 만든다 */
export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' });
  } finally {
    clearSession();
  }
}

export function signup(req: SignupRequest): Promise<Member> {
  return apiFetch<Member>('/auth/signup', { method: 'POST', body: req });
}

/** 비밀번호 찾기 (CM-03). 가입 여부와 무관하게 항상 성공 응답 */
export function requestPasswordReset(email: string): Promise<void> {
  return apiFetch<void>('/auth/password/reset-request', { method: 'POST', body: { email } });
}

/** 재설정 (CM-04). 서버가 모든 Refresh 를 폐기하므로 새 비밀번호로 다시 로그인한다 */
export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiFetch<void>('/auth/password/reset', { method: 'POST', body: { token, newPassword } });
}

/** 비회원 조회 비밀번호 재설정 메일 (CU-06 ①). 티켓번호·이메일이 맞든 아니든 항상 성공 응답 */
export function requestGuestPasswordReset(ticketNo: string, email: string): Promise<void> {
  return apiFetch<void>('/auth/guest/reset-request', { method: 'POST', body: { ticketNo, email } });
}

/** 새 조회 비밀번호 (CU-06 ②) */
export function resetGuestPassword(token: string, newPassword: string): Promise<void> {
  return apiFetch<void>('/auth/guest/reset', { method: 'POST', body: { token, newPassword } });
}

export function getMe(): Promise<Member> {
  return apiFetch<Member>('/members/me');
}

export interface GuestLoginRequest {
  ticketNo: string;
  email: string;
  password: string;
}

/** 비회원 문의 조회 (CU-05). 성공하면 Guest 토큰을 메모리에 두고 ticketId 를 돌려준다 */
export async function guestLogin(req: GuestLoginRequest): Promise<number> {
  const res = await apiFetch<{ guestToken: string; ticketId: number }>('/auth/guest', {
    method: 'POST',
    body: req,
  });
  setGuestSession(res.guestToken, res.ticketId);
  return res.ticketId;
}
