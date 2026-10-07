// @owner SSJ
// 상태/유형 분포 가로 막대 (docs/09 CS-04). 차트 라이브러리 없이 CSS 너비로 그린다
// ponytail: CSS 막대, 추세(시계열) 차트가 필요해지면 그때 차트 라이브러리 CR
import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/common/states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

interface DistributionBarsProps {
  title: string;
  /** 백엔드가 많은 순으로 내려준다 */
  counts: Record<string, number>;
  /** 모르는 키는 원문 그대로 */
  labelOf: (key: string) => string;
  /** AI 가 분류한 값이면 제목에 푸시아 아이콘 (시안 A안) */
  ai?: boolean;
}

export function DistributionBars({ title, counts, labelOf, ai }: DistributionBarsProps) {
  const entries = Object.entries(counts);
  const max = Math.max(0, ...entries.map(([, c]) => c));

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn('flex items-center gap-1.5', ai && 'text-ai')}>
          {ai && <Sparkles className="size-4" aria-hidden="true" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState title="기간 내 접수된 티켓이 없습니다." />
        ) : (
          <ul className="space-y-3.5">
            {entries.map(([key, count]) => (
              <li key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{labelOf(key)}</span>
                  <span className="text-muted-foreground tabular-nums">{formatNumber(count)}</span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${max === 0 ? 0 : (count / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
