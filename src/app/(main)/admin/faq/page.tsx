// @owner BSJ
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { FaqAdmin } from './faq-admin';

export const metadata: Metadata = { title: 'FAQ 관리 | HelpNest' };

export default function AdminFaqPage() {
  return (
    <AuthGuard roles={['LEAD', 'ADMIN']}>
      <FaqAdmin />
    </AuthGuard>
  );
}
