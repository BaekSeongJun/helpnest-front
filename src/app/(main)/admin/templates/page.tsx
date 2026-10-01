// @owner BSJ
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { TemplateAdmin } from './template-admin';

export const metadata: Metadata = { title: '템플릿 관리 | HelpNest' };

export default function AdminTemplatesPage() {
  return (
    <AuthGuard roles={['LEAD', 'ADMIN']}>
      <TemplateAdmin />
    </AuthGuard>
  );
}
