// @owner SSJ
// CS-05 월간 리포트 (docs/09 §2.3, FR-RPT-01·02). LEAD+
import { AuthGuard } from '@/lib/auth/auth-guard';
import { ReportsView } from './reports-view';

export default function ReportsPage() {
  return (
    <AuthGuard roles={['LEAD', 'ADMIN']}>
      <ReportsView />
    </AuthGuard>
  );
}
