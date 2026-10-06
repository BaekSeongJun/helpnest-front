// @owner BSJ
// CS-07 고객 이력 본체: 고객 정보 + 요약 KPI + 문의 목록
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StatusBadge } from '@/components/common/badges';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { SurveyKpis } from '@/components/survey/survey-kpis';
import { CATEGORY_LABEL } from '@/config/badge';
import {
  type CustomerHistoryItem,
  customerHistoryKeys,
  getCustomerHistory,
} from '@/lib/api/customer-history';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';

const EMPTY = '-';

export function CustomerHistoryView({ customerKey }: { customerKey: string }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: customerHistoryKeys.byKey(customerKey, page),
    queryFn: () => getCustomerHistory(customerKey, page),
    // 페이지를 넘길 때 요약·표가 빈 상태로 깜빡이지 않게 이전 결과를 유지한다
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<CustomerHistoryItem>[] = [
    {
      header: '티켓번호',
      cell: (r) => <span className="font-mono text-sm">{r.ticketNo}</span>,
      className: 'w-44',
    },
    { header: '제목', cell: (r) => <span className="line-clamp-1">{r.title}</span> },
    {
      header: '유형',
      cell: (r) => (CATEGORY_LABEL as Record<string, string>)[r.category] ?? r.category,
      className: 'w-20',
    },
    { header: '상태', cell: (r) => <StatusBadge status={r.status} />, className: 'w-24' },
    {
      header: '만족도',
      cell: (r) =>
        r.rating == null ? (
          <span className="text-muted-foreground">{EMPTY}</span>
        ) : (
          <span className="inline-flex items-center gap-1" aria-label={`${r.rating}점`}>
            <Star className="fill-warning text-warning size-4" aria-hidden />
            {r.rating}
          </span>
        ),
      className: 'w-20',
    },
    { header: '접수일', cell: (r) => formatDate(r.createdAt), className: 'w-28' },
  ];

  // 비회원 키는 이메일이라 이름이 없으면 그대로 보여 준다 (콘솔은 상담원 전용 화면)
  const title =
    data?.customerName ?? (customerKey.startsWith('G-') ? customerKey.slice(2) : '고객');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${title} 고객 이력`}
        description={
          customerKey.startsWith('G-')
            ? '비회원 · 이메일 기준으로 묶은 문의입니다.'
            : '회원 문의 이력입니다.'
        }
      />

      {isError ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : isPending ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : (
        <>
          <SurveyKpis
            columns="grid-cols-1 sm:grid-cols-3"
            items={[
              { label: '총 문의', value: formatNumber(data.summary.totalCount) },
              {
                label: '평균 만족도',
                value: data.summary.avgRating == null ? EMPTY : data.summary.avgRating.toFixed(1),
                hint: '5점 만점',
              },
              {
                label: '최근 문의',
                value: data.summary.lastTicketAt
                  ? formatDateTime(data.summary.lastTicketAt)
                  : EMPTY,
              },
            ]}
          />
          <DataTable
            columns={columns}
            data={data.tickets.content}
            rowKey={(r) => r.ticketId}
            emptyText="이 고객의 문의가 없습니다."
            pagination={{
              page: data.tickets.page,
              totalPages: data.tickets.totalPages,
              onPageChange: setPage,
            }}
            // 행 클릭 → 티켓 상세 (CS-02)
            onRowClick={(r) => router.push(`/console/tickets/${r.ticketId}`)}
          />
        </>
      )}
    </div>
  );
}
