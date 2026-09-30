// @owner BSJ
// 백엔드 enum·DTO 와 같은 이름·값 (docs/03 §2.1, 04 §2)

export type Role = 'CUSTOMER' | 'AGENT' | 'LEAD' | 'ADMIN';

/** GET /api/members/me, 로그인 응답의 member */
export interface Member {
  memberId: number;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  available: boolean;
}

/** POST /api/auth/login·refresh 응답 본문. Refresh 토큰은 httpOnly 쿠키라 여기 없음 */
export interface AuthResponse {
  accessToken: string;
  member: Member;
}
