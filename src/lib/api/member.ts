// @owner BSJ
// 회원 관리 API (docs/04 §2). apiFetch 가 /api 를 붙인다
import type { PageResponse } from '@/types/api';
import type { Member } from '@/types/auth';
import type {
  AdminMember,
  AdminMemberCreateRequest,
  AdminMemberQuery,
  AdminMemberUpdateRequest,
} from '@/types/member';
import { apiFetch, updateSessionMember } from './client';

/** 상담 가능 ON/OFF (AGENT 전용). 성공하면 헤더 등이 보는 세션 회원도 갱신 */
export async function updateAvailability(available: boolean): Promise<Member> {
  const member = await apiFetch<Member>('/members/me/availability', {
    method: 'PATCH',
    body: { available },
  });
  updateSessionMember(member);
  return member;
}

// ---- 관리 (AD-01, ADMIN) ----

export function getAdminMembers({ role, status, page }: AdminMemberQuery = {}): Promise<
  PageResponse<AdminMember>
> {
  const search = new URLSearchParams();
  if (role) search.set('role', role);
  if (status) search.set('status', status);
  if (page) search.set('page', String(page));
  const qs = search.toString();
  return apiFetch<PageResponse<AdminMember>>(`/admin/members${qs ? `?${qs}` : ''}`);
}

export function createAdminMember(req: AdminMemberCreateRequest): Promise<AdminMember> {
  return apiFetch<AdminMember>('/admin/members', { method: 'POST', body: req });
}

/** 역할·상태 변경. 비활성·역할 변경 시 서버가 그 회원의 Refresh 토큰을 모두 폐기한다 */
export function updateAdminMember(
  memberId: number,
  req: AdminMemberUpdateRequest,
): Promise<AdminMember> {
  return apiFetch<AdminMember>(`/admin/members/${memberId}`, { method: 'PATCH', body: req });
}

export const memberKeys = {
  all: ['members'] as const,
  admin: (query: AdminMemberQuery) => ['members', 'admin', query] as const,
};
