// @owner BSJ
'use client'; // 오류 경계는 클라이언트 컴포넌트여야 한다

import { ErrorState } from '@/components/common/states';

/** 화면 렌더링 중 예상하지 못한 오류 — 공용 셸(헤더)은 남기고 본문만 바꾼다 */
export default function MainError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState message="화면을 표시하지 못했습니다." onRetry={retry} />;
}
