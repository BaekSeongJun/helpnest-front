// @owner BSJ
// 관리자 계정 관리 타입 (백엔드 domain/member/dto, docs/04 §2)
import type { Role } from './auth';

export type MemberStatus = 'ACTIVE' | 'INACTIVE';

/** GET /api/admin/members 행 */
export interface AdminMember {
  memberId: number;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: MemberStatus;
  available: boolean;
  createdAt: string;
}

/** 상담원·팀장만 생성 가능 */
export interface AdminMemberCreateRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'AGENT' | 'LEAD';
}

/** 생략한 항목은 그대로 */
export interface AdminMemberUpdateRequest {
  role?: Role;
  status?: MemberStatus;
}

export interface AdminMemberQuery {
  role?: Role;
  status?: MemberStatus;
  page?: number;
}
