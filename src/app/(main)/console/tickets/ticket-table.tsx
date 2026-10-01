// @owner PMJ
// CS-01 10열 티켓 표 (docs/09 §2.3). 정렬은 서버가 한다 — 프론트에서 재정렬하면 페이지 경계에서 순서가 깨진다
'use client';

import { useRouter } from 'next/navigation';
import { PriorityBadge, SentimentBadge, SlaBadge, StatusBadge } from '@/components/common/badges';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CATEGORY_LABEL } from '@/config/badge';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { TicketListItem, TicketPage } from '@/types/ticket';

interface TicketTableProps {
  page: TicketPage | undefined;
  loading: boolean;
  onPageChange: (page: number) => void;
  onReset: () => void;
}

const COLUMNS: DataTableColumn<TicketListItem>[] = [
  {
    header: '번호',
    cell: (t) => t.ticketNo,
    className: 'w-44 font-mono text-xs',
  },
  { header: '제목', cell: (t) => <span className="line-clamp-1">{t.title}</span> },
  { header: '고객', cell: (t) => t.customerName, className: 'w-24' },
  {
    header: '유형',
    cell: (t) => CATEGORY_LABEL[t.category] ?? t.category,
    className: 'w-24',
  },
  { header: '우선순위', cell: (t) => <PriorityBadge priority={t.priority} />, className: 'w-24' },
  { header: '불만', cell: (t) => <SentimentBadge sentiment={t.sentiment} />, className: 'w-20' },
  { header: '상태', cell: (t) => <StatusBadge status={t.status} />, className: 'w-24' },
  {
    header: 'SLA',
    // 판정을 여기서 다시 쓰지 않는다 — CS-02 상세도 같은 SlaBadge 를 쓰므로 두 화면이 어긋날 수 없다
    cell: (t) => (
      <SlaBadge
        dueAt={t.firstResponseDueAt}
        respondedAt={t.firstRespondedAt}
        breached={t.slaBreached}
        warning={t.slaWarned}
      />
    ),
    className: 'w-24',
  },
  {
    header: '담당',
    cell: (t) => t.agentName ?? <span className="text-muted-foreground">미배정</span>,
    className: 'w-24',
  },
  {
    header: '접수일',
    cell: (t) => (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* 서버·브라우저 렌더 시각이 분 경계에서 어긋날 수 있다 */}
          <time dateTime={t.createdAt} suppressHydrationWarning>
            {formatRelative(t.createdAt)}
          </time>
        </TooltipTrigger>
        <TooltipContent>{formatDateTime(t.createdAt)}</TooltipContent>
      </Tooltip>
    ),
    className: 'w-28',
  },
];

export function TicketTable({ page, loading, onPageChange, onReset }: TicketTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={COLUMNS}
      data={page?.content}
      rowKey={(t) => t.ticketId}
      loading={loading}
      emptyText="조건에 맞는 티켓이 없습니다"
      emptyAction={
        <button type="button" onClick={onReset} className="text-primary text-sm underline">
          필터 초기화
        </button>
      }
      pagination={page && { page: page.page, totalPages: page.totalPages, onPageChange }}
      onRowClick={(t) => router.push(`/console/tickets/${t.ticketId}`)}
    />
  );
}
