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
