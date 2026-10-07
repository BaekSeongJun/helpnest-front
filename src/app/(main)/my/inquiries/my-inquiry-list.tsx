// @owner BSJ
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, PenSquare } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '@/components/common/badges';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABEL } from '@/config/badge';
import { formatDate } from '@/lib/format';
import { getMyTickets, ticketKeys } from '@/lib/api/ticket';

/**
 * 내 문의 목록 (CU-08, CUSTOMER). 최신 접수순.
 * ponytail: 상태 필터 없음 — GET /tickets/my 가 status 를 아직 받지 않는다(박민재 CR 보류). 받게 되면 FilterBar 추가
 */
export function MyInquiryList() {
  const [page, setPage] = useState(0);
  const query = { page };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ticketKeys.my(query),
    queryFn: () => getMyTickets(query),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title="내 문의"
        description="문의하신 내용과 답변을 한곳에서 확인할 수 있어요."
        actions={
          <Button asChild>
            <Link href="/inquiry/new">
              <PenSquare className="size-4" />
              문의하기
            </Link>
          </Button>
        }
      />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isPending ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : !data.content.length ? (
        <EmptyState
          title="아직 남긴 문의가 없습니다"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/inquiry/new">문의하기</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* 시안 A안: 문의마다 카드 — 제목·상태, 아래 번호·유형·접수일 */}
          <ul className="space-y-2">
            {data.content.map((t) => (
              <li key={t.ticketId}>
                <Link
                  href={`/my/inquiries/${t.ticketId}`}
                  className="bg-card hover:border-primary/40 flex flex-col gap-2 rounded-lg border px-5 py-4 shadow-xs transition-colors"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </span>
                  <span className="text-muted-foreground flex gap-1.5 text-xs">
                    <span className="font-mono">{t.ticketNo}</span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABEL[t.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatDate(t.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && (
            <nav aria-label="페이지" className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="이전 페이지"
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="다음 페이지"
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
