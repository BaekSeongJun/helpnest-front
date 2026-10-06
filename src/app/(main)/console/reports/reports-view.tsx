// @owner SSJ
// CS-05 월간 리포트 본체. 월은 화면 상태로만 둔다(대시보드 기간과 같은 방식)
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { formatHours, formatRating } from '@/components/dashboard/AgentTable';
import { CsvButton } from '@/components/dashboard/CsvButton';
import { DistributionBars } from '@/components/dashboard/DistributionBars';
import { KpiGrid } from '@/components/dashboard/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CATEGORY_LABEL } from '@/config/badge';
import {
  type CategoryRow,
  downloadReportCsv,
  getMonthlyReport,
  seoulToday,
} from '@/lib/api/report';
import { formatDuration, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

const categoryLabel = (k: string) => CATEGORY_LABEL[k as keyof typeof CATEGORY_LABEL] ?? k;

/** 전월 대비 % (소수 1자리, 서버 CSV 와 같은 계산). 전월 0 이면 null */
function changeRate(count: number, prev: number): number | null {
  return prev === 0 ? null : Math.round((1000 * (count - prev)) / prev) / 10;
}

function formatChange(count: number, prev: number): string {
  const rate = changeRate(count, prev);
  const diff = count - prev;
  const sign = diff > 0 ? '+' : '';
  return rate == null ? `${sign}${diff}` : `${sign}${diff} (${sign}${rate}%)`;
}

export function ReportsView() {
  const [month, setMonth] = useState(() => seoulToday().slice(0, 7));
  const report = useQuery({
    queryKey: ['report', 'monthly', month],
    queryFn: () => getMonthlyReport(month),
    enabled: month !== '',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="월간 리포트"
        description="그 달에 접수된 티켓 기준입니다."
        actions={
          <>
            <Input
              type="month"
              aria-label="조회 월"
              className="w-40"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <CsvButton onDownload={() => downloadReportCsv(month)} />
          </>
        }
      />

      {report.isError ? (
        <ErrorState message={report.error.message} onRetry={() => void report.refetch()} />
      ) : report.isPending ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : report.data.total === 0 && report.data.prevTotal === 0 ? (
        <EmptyState title="이 달에 접수된 문의가 없습니다." />
      ) : (
        <>
          <KpiGrid
            items={[
              {
                label: '총 문의',
                value: formatNumber(report.data.total),
                hint: `전월 대비 ${formatChange(report.data.total, report.data.prevTotal)}`,
              },
              { label: '평균 첫 응답', value: formatDuration(report.data.avgFirstResponseMin) },
              { label: '평균 처리시간', value: formatHours(report.data.avgResolveHour) },
              { label: 'SLA 위반율', value: formatPercent(report.data.slaBreachRate) },
              { label: '불만 비율', value: formatPercent(report.data.negativeRate) },
              { label: '평균 만족도', value: formatRating(report.data.avgRating) },
            ]}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <DistributionBars
              title="유형별 건수"
              counts={Object.fromEntries(
                report.data.byCategory.filter((c) => c.count > 0).map((c) => [c.category, c.count]),
              )}
              labelOf={categoryLabel}
            />
            <CategoryTable rows={report.data.byCategory} />
          </div>
        </>
      )}
    </div>
  );
}

function CategoryTable({ rows }: { rows: readonly CategoryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>유형별 상세</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>유형</TableHead>
              <TableHead className="text-right">건수</TableHead>
              <TableHead className="text-right">전월</TableHead>
              <TableHead className="text-right">증감</TableHead>
              <TableHead className="text-right">처리시간</TableHead>
              <TableHead className="text-right">불만 비율</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.category}>
                <TableCell className="font-medium">{categoryLabel(r.category)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(r.count)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(r.prevCount)}
                </TableCell>
                {/* 문의 증가는 부정 신호라 destructive, 감소는 muted */}
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    r.count > r.prevCount && 'text-destructive',
                    r.count < r.prevCount && 'text-muted-foreground',
                  )}
                >
                  {formatChange(r.count, r.prevCount)}
                </TableCell>
                <TableCell className="text-right">{formatHours(r.avgResolveHour)}</TableCell>
                <TableCell className="text-right">{formatPercent(r.negativeRate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
