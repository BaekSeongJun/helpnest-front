// @owner BSJ
// CS-06 설문 결과 (docs/09 §2.3, FR-SRV-05). AGENT 는 본인 담당분, LEAD+ 는 전체
import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/common/states';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { SurveysView } from './surveys-view';

export default function ConsoleSurveysPage() {
  return (
    // 역할 계층이 없어 허용 역할을 모두 적는다 (config/menu.ts AGENT_UP 과 동일)
    <AuthGuard roles={['AGENT', 'LEAD', 'ADMIN']}>
      {/* useSearchParams 를 쓰는 컴포넌트는 Next 16 에서 Suspense 경계가 필요하다 */}
      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <SurveysView />
      </Suspense>
    </AuthGuard>
  );
}
