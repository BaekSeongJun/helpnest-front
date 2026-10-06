// @owner SSJ
// 상담원별 처리현황 표 (docs/09 CS-04, LEAD+)
import { EmptyState } from '@/components/common/states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AgentStat } from '@/lib/api/dashboard';
import { formatDuration, formatNumber, formatPercent } from '@/lib/format';

export function AgentTable({ agents }: { agents: readonly AgentStat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>상담원별 처리현황</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <EmptyState title="활성 상담원이 없습니다." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>상담원</TableHead>
                <TableHead className="text-right">배정</TableHead>
                <TableHead className="text-right">처리중</TableHead>
                <TableHead className="text-right">오늘 해결</TableHead>
                <TableHead className="text-right">평균 첫 응답</TableHead>
                <TableHead className="text-right">평균 해결</TableHead>
                <TableHead className="text-right">SLA 위반율</TableHead>
                <TableHead className="text-right">평균 만족도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((a) => (
                <TableRow key={a.agentId}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(a.assignedCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(a.inProgressCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(a.resolvedToday)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDuration(a.avgFirstResponseMin)}
                  </TableCell>
                  <TableCell className="text-right">{formatHours(a.avgResolveHour)}</TableCell>
                  <TableCell className="text-right">{formatPercent(a.slaBreachRate)}</TableCell>
                  <TableCell className="text-right">{formatRating(a.avgRating)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** 시간(2.5) → "2시간 30분" */
export function formatHours(hours: number | null): string {
  return formatDuration(hours == null ? null : hours * 60);
}

/** 별점(4.25) → "4.3", 없으면 "-" */
export function formatRating(rating: number | null): string {
  return rating == null ? '-' : rating.toFixed(1);
}
