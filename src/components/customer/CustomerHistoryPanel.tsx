// @owner BSJ
// 티켓 상세(CS-02) 우측 고객 이력 패널. 박민재 TicketSidePanel 의 주입 자리에는 <CustomerHistoryPanel ticketId={id} /> 한 줄만 넣는다
'use client';

import { useQuery } from '@tanstack/react-query';
import { RotateCw, Star } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/common/badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  customerHistoryHref,
  customerHistoryKeys,
  getCustomerHistoryByTicket,
} from '@/lib/api/customer-history';
import { formatDate } from '@/lib/format';

export function CustomerHistoryPanel({ ticketId }: { ticketId: number }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: customerHistoryKeys.byTicket(ticketId),
    queryFn: () => getCustomerHistoryByTicket(ticketId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">고객 이력</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          <div aria-busy="true" aria-label="불러오는 중" className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-2 text-sm">
            <p className="text-muted-foreground">고객 이력을 불러오지 못했습니다.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              <RotateCw className="size-4" aria-hidden />
              다시 시도
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              총 {data.summary.totalCount}건 · 평균 만족도{' '}
              {data.summary.avgRating == null ? '-' : data.summary.avgRating.toFixed(1)}
            </p>
            {data.tickets.content.length === 0 ? (
              <p className="text-muted-foreground text-sm">이전 문의가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {data.tickets.content.map((t) => (
                  <li key={t.ticketId}>
                    <Link
                      href={`/console/tickets/${t.ticketId}`}
                      className="hover:bg-muted block space-y-1 rounded-md border p-2 text-sm"
                    >
                      <span className="line-clamp-1 font-medium">{t.title}</span>
                      <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                        <StatusBadge status={t.status} />
                        {formatDate(t.createdAt)}
                        {t.rating != null && (
                          <span
                            className="inline-flex items-center gap-0.5"
                            aria-label={`${t.rating}점`}
                          >
                            <Star className="fill-warning text-warning size-3" aria-hidden />
                            {t.rating}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={customerHistoryHref(data.customerKey)}>전체 보기</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
