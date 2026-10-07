// @owner SSJ
// CS-04 대시보드 본체. 기간은 화면 상태로만 둔다(공유 링크 요구 없음)
'use client';

import {
  CircleCheck,
  CircleDot,
  Clock,
  Inbox,
  ShieldAlert,
  Smile,
  Timer,
  UserX,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { AgentTable, formatHours, formatRating } from '@/components/dashboard/AgentTable';
import { CsvButton } from '@/components/dashboard/CsvButton';
import { DistributionBars } from '@/components/dashboard/DistributionBars';
import { KpiGrid } from '@/components/dashboard/KpiCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_LABEL, TICKET_STATUS_BADGE } from '@/config/badge';
import {
  type DashboardPeriod,
  getAgentStats,
  getDashboardSummary,
  getMyStat,
} from '@/lib/api/dashboard';
import { downloadAgentsCsv } from '@/lib/api/report';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDuration, formatNumber, formatPercent } from '@/lib/format';

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'TODAY', label: '오늘' },
  { value: '7D', label: '최근 7일' },
  { value: '30D', label: '최근 30일' },
];

export function DashboardView() {
  const { member } = useAuth();
  const isLead = member?.role === 'LEAD' || member?.role === 'ADMIN';
  const [period, setPeriod] = useState<DashboardPeriod>('TODAY');

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={isLead ? '기간 내 접수된 티켓 기준입니다.' : '내 처리현황입니다.'}
        actions={
          <>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
              <TabsList>
                {PERIODS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {/* 상담원별 처리현황 CSV (LEAD+) */}
            {isLead && <CsvButton onDownload={() => downloadAgentsCsv(period)} />}
          </>
        }
      />
      {isLead ? <TeamDashboard period={period} /> : <MyDashboard period={period} />}
    </div>
  );
}

function TeamDashboard({ period }: { period: DashboardPeriod }) {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary', period],
    queryFn: () => getDashboardSummary(period),
  });
  const agents = useQuery({
    queryKey: ['dashboard', 'agents', period],
    queryFn: () => getAgentStats(period),
  });

  if (summary.isError) {
    return <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />;
  }
  if (summary.isPending) return <LoadingSkeleton variant="card" count={5} />;

  const s = summary.data;
  return (
    <>
      <KpiGrid
        items={[
          { label: '전체 문의', value: formatNumber(s.total), icon: Inbox },
          { label: '미배정', value: formatNumber(s.unassigned), hint: '현재 기준', icon: UserX },
          { label: 'SLA 위반율', value: formatPercent(s.slaBreachRate), icon: ShieldAlert },
          { label: '평균 첫 응답', value: formatDuration(s.avgFirstResponseMin), icon: Timer },
          { label: '평균 만족도', value: formatRating(s.avgRating), icon: Smile },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionBars
          title="상태별"
          counts={s.byStatus}
          labelOf={(k) => TICKET_STATUS_BADGE[k as keyof typeof TICKET_STATUS_BADGE]?.label ?? k}
        />
        <DistributionBars
          title="유형별"
          counts={s.byCategory}
          labelOf={(k) => CATEGORY_LABEL[k as keyof typeof CATEGORY_LABEL] ?? k}
        />
      </div>
      {agents.isError ? (
        <ErrorState message={agents.error.message} onRetry={() => void agents.refetch()} />
      ) : agents.isPending ? (
        <LoadingSkeleton variant="table" />
      ) : (
        <AgentTable agents={agents.data} />
      )}
    </>
  );
}

function MyDashboard({ period }: { period: DashboardPeriod }) {
  const me = useQuery({
    queryKey: ['dashboard', 'me', period],
    queryFn: () => getMyStat(period),
  });

  if (me.isError) {
    return <ErrorState message={me.error.message} onRetry={() => void me.refetch()} />;
  }
  if (me.isPending) return <LoadingSkeleton variant="card" count={5} />;

  const a = me.data;
  // 상담원은 행이 항상 1개라 빈 상태가 없다 — 0건이면 숫자 0, 평균은 "-"
  return (
    <KpiGrid
      items={[
        {
          label: '배정 대기',
          value: formatNumber(a.assignedCount),
          hint: '현재 기준',
          icon: Inbox,
        },
        {
          label: '처리중',
          value: formatNumber(a.inProgressCount),
          hint: '현재 기준',
          icon: CircleDot,
        },
        { label: '오늘 해결', value: formatNumber(a.resolvedToday), icon: CircleCheck },
        { label: '평균 첫 응답', value: formatDuration(a.avgFirstResponseMin), icon: Timer },
        { label: '평균 해결 시간', value: formatHours(a.avgResolveHour), icon: Clock },
        { label: 'SLA 위반율', value: formatPercent(a.slaBreachRate), icon: ShieldAlert },
        { label: '평균 만족도', value: formatRating(a.avgRating), icon: Smile },
      ]}
    />
  );
}
