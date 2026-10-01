// @owner PMJ
// CS-01 티켓함 본체. useSearchParams 를 쓰므로 page.tsx 의 Suspense 안에서만 렌더된다
'use client';

import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/states';
import { TicketFilterBar } from './ticket-filter-bar';
import { TicketTable } from './ticket-table';
import { useConsoleTickets } from './use-console-tickets';

export function ConsoleTicketsView() {
  const { tab, canSeeAll, params, keyword, setKeyword, setFilters, reset, list } =
    useConsoleTickets();

  return (
    <div className="space-y-6">
      <PageHeader title="티켓함" description="SLA 임박순으로 정렬됩니다." />

      <TicketFilterBar
        tab={tab}
        canSeeAll={canSeeAll}
        params={params}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onChange={setFilters}
        onReset={reset}
      />

      {list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />
      ) : (
        <TicketTable
          page={list.data}
          loading={list.isPending}
          onPageChange={(page) => setFilters({ page: String(page) })}
          onReset={reset}
        />
      )}
    </div>
  );
}
