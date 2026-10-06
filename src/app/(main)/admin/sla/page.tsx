// @owner PMJ
// AD-04 SLA 정책 (docs/09 §2.4). 조회는 LEAD+, 수정은 ADMIN — 수정 권한은 서버가 막고(PUT 403)
// 화면은 LEAD 에게 편집 UI 자체를 내보내지 않는다.
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { SlaAdmin } from './sla-admin';

export const metadata: Metadata = { title: 'SLA 정책 | HelpNest' };

export default function AdminSlaPage() {
  return (
    <AuthGuard roles={['LEAD', 'ADMIN']}>
      <SlaAdmin />
    </AuthGuard>
  );
}
