// @owner BSJ
// 상담원 상세 본체: 팀 평균 대비 KPI + 일별 추이 + 유형·우선순위 분해 + 최근 티켓·설문
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CircleCheck,
  CircleDot,
  Clock,
  Inbox,
  ShieldAlert,
  Smile,
  Star,
  Timer,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { PriorityBadge, StatusBadge } from '@/components/common/badges';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { formatHours, formatRating } from '@/components/dashboard/AgentTable';
import { KpiGrid } from '@/components/dashboard/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_LABEL, PRIORITY_BADGE } from '@/config/badge';
import {
  type AgentBreakdown,
  type AgentDaily,
  type AgentRecentSurvey,
  type AgentRecentTicket,
  getAgentDetail,
} from '@/lib/api/agent-detail';
import type { DashboardPeriod } from '@/lib/api/dashboard';
import { formatDate, formatDuration, formatNumber, formatPercent } from '@/lib/format';

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'TODAY', label: '오늘' },
  { value: '7D', label: '최근 7일' },
  { value: '30D', label: '최근 30일' },
];

const categoryLabel = (k: string) => (CATEGORY_LABEL as Record<string, string>)[k] ?? k;
const priorityLabel = (k: string) =>
  (PRIORITY_BADGE as Record<string, { label: string }>)[k]?.label ?? k;

export function AgentDetailView({ agentId }: { agentId: number }) {
  const router = useRouter();
  // 대시보드와 같은 기본값 대신 7일 — 하루치로는 추이가 안 보인다
  const [period, setPeriod] = useState<DashboardPeriod>('7D');
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', 'agent-detail', agentId, period],
    queryFn: () => getAgentDetail(agentId, period),
  });
  const toTicket = (r: { ticketId: number }) => router.push(`/console/tickets/${r.ticketId}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title={data ? `${data.agent.name} 상담원` : '상담원 상세'}
        description="기간 내 접수된 담당 티켓 기준입니다. 카드 아래는 팀 평균입니다."
        actions={
          <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
            <TabsList>
              {PERIODS.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {isError ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : isPending ? (
        <LoadingSkeleton variant="card" count={7} />
      ) : (
        <>
          <KpiGrid
            items={[
              {
                label: '배정 대기',
                value: formatNumber(data.agent.assignedCount),
                hint: `팀 평균 ${formatNumber(data.teamAverage.assignedCount)} · 현재 기준`,
                icon: Inbox,
              },
              {
                label: '처리중',
                value: formatNumber(data.agent.inProgressCount),
                hint: `팀 평균 ${formatNumber(data.teamAverage.inProgressCount)} · 현재 기준`,
                icon: CircleDot,
              },
              {
                label: '오늘 해결',
                value: formatNumber(data.agent.resolvedToday),
                hint: `팀 평균 ${formatNumber(data.teamAverage.resolvedToday)}`,
                icon: CircleCheck,
              },
              {
                label: '평균 첫 응답',
                value: formatDuration(data.agent.avgFirstResponseMin),
                hint: `팀 평균 ${formatDuration(data.teamAverage.avgFirstResponseMin)}`,
                icon: Timer,
              },
              {
                label: '평균 해결 시간',
                value: formatHours(data.agent.avgResolveHour),
                hint: `팀 평균 ${formatHours(data.teamAverage.avgResolveHour)}`,
                icon: Clock,
              },
              {
                label: 'SLA 위반율',
                value: formatPercent(data.agent.slaBreachRate),
                hint: `팀 평균 ${formatPercent(data.teamAverage.slaBreachRate)}`,
                icon: ShieldAlert,
              },
              {
                label: '평균 만족도',
                value: formatRating(data.agent.avgRating),
                hint: `팀 평균 ${formatRating(data.teamAverage.avgRating)}`,
                icon: Smile,
              },
            ]}
          />
          <DailyChart daily={data.daily} />
          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable title="유형별" rows={data.byCategory} labelOf={categoryLabel} />
            <BreakdownTable title="우선순위별" rows={data.byPriority} labelOf={priorityLabel} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ListCard title="최근 담당 티켓">
              <DataTable
                columns={ticketColumns}
                data={data.tickets}
                rowKey={(r) => r.ticketId}
                emptyText="기간 내 담당 티켓이 없습니다."
                onRowClick={toTicket}
              />
            </ListCard>
            <ListCard title="최근 설문">
              <DataTable
                columns={surveyColumns}
                data={data.surveys}
                rowKey={(r) => r.ticketId}
                emptyText="기간 내 제출된 설문이 없습니다."
                onRowClick={toTicket}
              />
            </ListCard>
          </div>
        </>
      )}
    </div>
  );
}

/** 일별 접수(진한 막대)·해결(연한 막대). CSS 막대 — DistributionBars 와 같은 방식, 차트 라이브러리 없음 */
function DailyChart({ daily }: { daily: AgentDaily[] }) {
  const max = Math.max(1, ...daily.flatMap((d) => [d.received, d.resolved]));
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>일별 추이</CardTitle>
        <span className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="bg-primary size-2.5 rounded-sm" aria-hidden />
            접수
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-success size-2.5 rounded-sm" aria-hidden />
            해결
          </span>
        </span>
      </CardHeader>
      <CardContent>
        <ul className="flex h-40 items-end gap-1 overflow-x-auto">
          {daily.map((d) => (
            <li
              key={d.day}
              className="flex h-full min-w-4 flex-1 flex-col items-center justify-end gap-1"
              title={`${d.day} 접수 ${d.received} · 해결 ${d.resolved} · 첫 응답 ${formatDuration(d.avgFirstResponseMin)}`}
            >
              <div className="flex h-full w-full items-end justify-center gap-px">
                <div
                  className="bg-primary w-1/2 max-w-3 rounded-t-sm"
                  style={{ height: `${(d.received / max) * 100}%` }}
                />
                <div
                  className="bg-success w-1/2 max-w-3 rounded-t-sm"
                  style={{ height: `${(d.resolved / max) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">{d.day.slice(8)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function BreakdownTable({
  title,
  rows,
  labelOf,
}: {
  title: string;
  rows: AgentBreakdown[];
  labelOf: (key: string) => string;
}) {
  const columns: DataTableColumn<AgentBreakdown>[] = [
    { header: '구분', cell: (r) => labelOf(r.key) },
    {
      header: '건수',
      cell: (r) => formatNumber(r.count),
      className: 'w-16 text-right tabular-nums',
    },
    {
      header: '평균 해결',
      cell: (r) => formatHours(r.avgResolveHour),
      className: 'w-28 text-right',
    },
    {
      header: 'SLA 위반율',
      cell: (r) => formatPercent(r.slaBreachRate),
      className: 'w-24 text-right',
    },
  ];
  return (
    <ListCard title={title}>
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.key}
        emptyText="기간 내 담당 티켓이 없습니다."
      />
    </ListCard>
  );
}

function ListCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const ticketColumns: DataTableColumn<AgentRecentTicket>[] = [
  {
    header: '티켓번호',
    cell: (r) => <span className="font-mono text-sm">{r.ticketNo}</span>,
    className: 'w-44',
  },
  { header: '제목', cell: (r) => <span className="line-clamp-1">{r.title}</span> },
  { header: '우선순위', cell: (r) => <PriorityBadge priority={r.priority} />, className: 'w-20' },
  { header: '상태', cell: (r) => <StatusBadge status={r.status} />, className: 'w-24' },
  { header: '접수일', cell: (r) => formatDate(r.createdAt), className: 'w-28' },
];

const surveyColumns: DataTableColumn<AgentRecentSurvey>[] = [
  {
    header: '티켓번호',
    cell: (r) => <span className="font-mono text-sm">{r.ticketNo}</span>,
    className: 'w-44',
  },
  {
    header: '별점',
    cell: (r) => (
      <span className="inline-flex items-center gap-1" aria-label={`${r.rating}점`}>
        <Star className="fill-warning text-warning size-4" aria-hidden />
        {r.rating}
      </span>
    ),
    className: 'w-16',
  },
  {
    header: '의견',
    cell: (r) => <span className="line-clamp-1">{r.comment || '-'}</span>,
  },
  { header: '제출일', cell: (r) => formatDate(r.submittedAt), className: 'w-28' },
];
