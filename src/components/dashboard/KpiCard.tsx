// @owner SSJ
// 대시보드 KPI 카드 (docs/09 CS-04). 값은 호출자가 lib/format 으로 문자열화해서 넘긴다
// 시안 A안: 라벨 + 오른쪽 둥근 아이콘, 큰 숫자, 아래 보조 문구
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Kpi {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  /** AI 지표면 푸시아 아이콘 */
  ai?: boolean;
}

export function KpiGrid({ items }: { items: readonly Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
      {items.map(({ label, value, hint, icon: Icon, ai }) => (
        <div
          key={label}
          className="bg-card text-card-foreground flex flex-col gap-2.5 rounded-lg border p-5 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm">{label}</span>
            {Icon && (
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  ai ? 'bg-ai/10 text-ai' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            )}
          </div>
          <p className="text-3xl leading-tight font-bold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
      ))}
    </div>
  );
}
