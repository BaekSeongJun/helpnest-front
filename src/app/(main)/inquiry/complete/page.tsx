// @owner BSJ
import { CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: '접수 완료 | HelpNest' };

/** 접수 완료 (CU-04). 문의하기에서 ?ticketNo=…&guest=1 로 넘어온다 */
export default async function InquiryCompletePage({
  searchParams,
}: PageProps<'/inquiry/complete'>) {
  const { ticketNo, guest } = await searchParams;

  if (typeof ticketNo !== 'string' || !ticketNo) {
    return (
      <EmptyState
        title="접수 정보가 없습니다"
        action={
          <Button asChild>
            <Link href="/inquiry/new">문의하기</Link>
          </Button>
        }
      />
    );
  }

  const isGuest = guest === '1';
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
          <CircleCheck className="text-success size-12" aria-hidden />
          <h1 className="text-xl font-semibold">문의가 접수되었습니다</h1>
          <div className="bg-muted w-full rounded-lg p-4">
            <p className="text-muted-foreground text-sm">티켓번호</p>
            <p className="font-mono text-lg font-semibold tracking-wide">{ticketNo}</p>
          </div>
          {isGuest && (
            <p className="text-destructive text-sm font-medium">
              티켓번호를 꼭 저장해 주세요. 답변을 확인할 때 이메일·조회 비밀번호와 함께 필요해요.
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            보통 24시간 안에 첫 답변을 드려요.
            {isGuest && ' 답변이 등록되면 입력하신 이메일로 알려 드려요.'}
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={isGuest ? '/inquiry/lookup' : '/my/inquiries'}>
                {isGuest ? '문의 조회' : '내 문의 보기'}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">홈으로</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
