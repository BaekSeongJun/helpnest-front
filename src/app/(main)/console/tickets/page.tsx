// @owner PMJ
// CS-01 상담 콘솔 티켓함 (docs/09 §2.3). 직원은 로그인 직후 이 경로로 이동한다(login-form.tsx redirectTarget)
import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/common/states';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { ConsoleTicketsView } from './console-tickets-view';

export default function ConsoleTicketsPage() {
  return (
    // 역할 계층이 없어 허용 역할을 모두 적는다 (config/menu.ts AGENT_UP 과 동일)
    <AuthGuard roles={['AGENT', 'LEAD', 'ADMIN']}>
      {/* useSearchParams 를 쓰는 컴포넌트는 Next 16 에서 Suspense 경계가 필요하다 */}
      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <ConsoleTicketsView />
      </Suspense>
    </AuthGuard>
  );
}
