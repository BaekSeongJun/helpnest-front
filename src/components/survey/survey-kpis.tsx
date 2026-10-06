// @owner BSJ
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SurveyKpi {
  label: string;
  value: string;
  hint?: string;
}

/**
 * 설문 요약 수치 2×2. 대시보드의 KpiGrid(SSJ)는 5열 고정이라 4개를 넣으면 한 칸이 비고 카드가 길쭉해져서
 * 같은 모양의 카드를 따로 둔다
 */
export function SurveyKpis({
  items,
  columns = 'grid-cols-2',
}: {
  items: readonly SurveyKpi[];
  /** 열 수 클래스. 카드가 3개처럼 2로 나누어떨어지지 않으면 호출자가 지정한다 */
  columns?: string;
}) {
  return (
    <div className={cn('grid gap-4', columns)}>
      {items.map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">{kpi.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
            {kpi.hint && <p className="text-muted-foreground text-xs">{kpi.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
