// @owner SSJ
// CS-04 대시보드 (docs/09 §2.3). LEAD+ 는 팀 전체, AGENT 는 본인 처리현황만 (FR-DSH-03)
import { AuthGuard } from '@/lib/auth/auth-guard';
import { DashboardView } from './dashboard-view';

export default function DashboardPage() {
  return (
    <AuthGuard roles={['AGENT', 'LEAD', 'ADMIN']}>
      <DashboardView />
    </AuthGuard>
  );
}
