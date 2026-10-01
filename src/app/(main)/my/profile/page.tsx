// @owner BSJ
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { MyProfile } from './my-profile';

export const metadata: Metadata = { title: '내 정보 | HelpNest' };

/** 내 정보 (CU-10). 로그인한 모든 역할 — Guest 토큰은 AuthGuard 가 로그인 화면으로 보낸다 */
export default function MyProfilePage() {
  return (
    <AuthGuard>
      <MyProfile />
    </AuthGuard>
  );
}
