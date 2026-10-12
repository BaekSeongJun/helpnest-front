// @owner BSJ
'use client'; // 아이콘(함수)을 EmptyState 에 넘기려면 클라이언트 컴포넌트여야 한다

import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/common/states';
import { MainShell } from '@/components/layout/main-shell';
import { Button } from '@/components/ui/button';

/** 없는 주소와 notFound() 를 모두 받는다. (main) 레이아웃 밖이라 공용 셸을 직접 감싼다 */
export default function NotFound() {
  return (
    <MainShell>
      <EmptyState
        icon={FileQuestion}
        title="페이지를 찾을 수 없습니다"
        description="주소가 바뀌었거나 삭제된 페이지예요."
        action={
          <Button asChild>
            <Link href="/">홈으로</Link>
          </Button>
        }
      />
    </MainShell>
  );
}
