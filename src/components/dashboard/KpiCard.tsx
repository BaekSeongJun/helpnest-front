// @owner SSJ
// 대시보드 KPI 카드 (docs/09 CS-04). 값은 호출자가 lib/format 으로 문자열화해서 넘긴다
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface Kpi {
  label: string;
  value: string;
  hint?: string;
}

export function KpiGrid({ items }: { items: readonly Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
