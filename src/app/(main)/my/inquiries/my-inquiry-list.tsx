// @owner BSJ
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StatusBadge } from '@/components/common/badges';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABEL } from '@/config/badge';
import { formatDate } from '@/lib/format';
import { getMyTickets, ticketKeys } from '@/lib/api/ticket';
import type { TicketListItem } from '@/types/ticket';

/**
 * 내 문의 목록 (CU-08, CUSTOMER). 최신 접수순.
 * ponytail: 상태 필터 없음 — GET /tickets/my 가 status 를 아직 받지 않는다(박민재 CR 보류). 받게 되면 FilterBar 추가
 */
export function MyInquiryList() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const query = { page };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ticketKeys.my(query),
    queryFn: () => getMyTickets(query),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<TicketListItem>[] = [
    {
      header: '티켓번호',
      cell: (t) => <span className="font-mono text-xs">{t.ticketNo}</span>,
      className: 'w-44',
    },
    { header: '제목', cell: (t) => t.title, className: 'whitespace-normal' },
    { header: '유형', cell: (t) => CATEGORY_LABEL[t.category], className: 'w-24' },
    { header: '상태', cell: (t) => <StatusBadge status={t.status} />, className: 'w-24' },
    { header: '접수일', cell: (t) => formatDate(t.createdAt), className: 'w-28 tabular-nums' },
  ];

  return (
    <div>
      <PageHeader
        title="내 문의"
        actions={
          <Button asChild>
            <Link href="/inquiry/new">문의하기</Link>
          </Button>
        }
      />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.content}
          rowKey={(t) => t.ticketId}
          loading={isPending}
          emptyText="아직 남긴 문의가 없습니다"
          emptyAction={
            <Button asChild variant="outline" size="sm">
              <Link href="/inquiry/new">문의하기</Link>
            </Button>
          }
          onRowClick={(t) => router.push(`/my/inquiries/${t.ticketId}`)}
          pagination={
            data && { page: data.page, totalPages: data.totalPages, onPageChange: setPage }
          }
        />
      )}
    </div>
  );
}
