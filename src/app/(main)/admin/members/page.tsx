// @owner BSJ
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { MemberAdmin } from './member-admin';

export const metadata: Metadata = { title: '계정 관리 | HelpNest' };

export default function AdminMembersPage() {
  return (
    <AuthGuard roles={['ADMIN']}>
      <MemberAdmin />
    </AuthGuard>
  );
}
