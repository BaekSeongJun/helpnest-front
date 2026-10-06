// @owner BSJ
// CS-06 설문 결과 본체. useSearchParams 를 쓰므로 page.tsx 의 Suspense 안에서만 렌더된다
'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { PlainText } from '@/components/common/plain-text';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { DistributionBars } from '@/components/dashboard/DistributionBars';
import { RatingStars } from '@/components/survey/rating-stars';
import { SurveyKpis } from '@/components/survey/survey-kpis';
import type { SurveyResult, SurveySummary } from '@/lib/api/console-survey';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import { SurveyFilterBar } from './survey-filter-bar';
import { useSurveyResults } from './use-survey-results';

const EMPTY = '-';

export function SurveysView() {
  const router = useRouter();
  const { params, canSeeAll, agents, setFilters, reset, summary, list } = useSurveyResults();

  const columns: DataTableColumn<SurveyResult>[] = [
    {
      header: '티켓번호',
      cell: (r) => <span className="font-mono text-sm">{r.ticketNo}</span>,
      className: 'w-44',
    },
    { header: '고객', cell: (r) => r.customerName ?? EMPTY, className: 'w-28' },
    { header: '상담원', cell: (r) => r.agentName ?? EMPTY, className: 'w-28' },
    { header: '별점', cell: (r) => <RatingStars rating={r.rating} />, className: 'w-32' },
    {
      header: '의견',
      // 고객이 쓴 본문이라 PlainText 로만 출력한다 (HTML 실행 금지, 04)
      cell: (r) =>
        r.comment ? (
          <PlainText text={r.comment} className="line-clamp-2 max-w-md" />
        ) : (
          <span className="text-muted-foreground">{EMPTY}</span>
        ),
    },
    { header: '제출일', cell: (r) => formatDateTime(r.submittedAt), className: 'w-40' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="설문 결과"
        description={
          canSeeAll
            ? '고객 만족도 설문 결과입니다. 기간은 설문을 보낸 날 기준입니다.'
            : '내가 담당한 티켓의 설문 결과입니다. 기간은 설문을 보낸 날 기준입니다.'
        }
      />

      <SurveyFilterBar
        params={params}
        canSeeAll={canSeeAll}
        agents={agents}
        onChange={setFilters}
        onReset={reset}
      />

      {summary.isError ? (
        <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
      ) : summary.isPending ? (
        <LoadingSkeleton variant="card" count={4} />
      ) : (
        <SummarySection summary={summary.data} />
      )}

      {list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={list.data?.content}
          rowKey={(r) => r.ticketId}
          loading={list.isPending}
          emptyText="조건에 맞는 설문 응답이 없습니다."
          pagination={
            list.data && {
              page: list.data.page,
              totalPages: list.data.totalPages,
              onPageChange: (page) => setFilters({ page: String(page) }),
            }
          }
          // 행 클릭 → 티켓 상세 (CS-02)
          onRowClick={(r) => router.push(`/console/tickets/${r.ticketId}`)}
        />
      )}
    </div>
  );
}

function SummarySection({ summary }: { summary: SurveySummary }) {
  // 별점 별 분포는 높은 점수가 위로 오게 쓴다. 숫자 키는 JS 가 오름차순으로 정렬하므로 '5점' 같은 문자열 키를 쓴다
  const distribution = Object.fromEntries(
    [5, 4, 3, 2, 1].map((n) => [`${n}점`, summary.distribution[String(n)] ?? 0]),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SurveyKpis
        items={[
          { label: '발송', value: formatNumber(summary.sent), hint: '설문 메일을 보낸 건수' },
          { label: '응답', value: formatNumber(summary.responded) },
          { label: '응답률', value: formatPercent(summary.responseRate) },
          {
            label: '평균 별점',
            value: summary.avgRating == null ? EMPTY : summary.avgRating.toFixed(1),
            hint: '5점 만점',
          },
        ]}
      />
      <DistributionBars title="별점 분포" counts={distribution} labelOf={(key) => key} />
    </div>
  );
}
