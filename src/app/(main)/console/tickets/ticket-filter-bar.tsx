// @owner PMJ
// CS-01 탭·필터·검색 바. 값은 전부 URL 에 있고 이 컴포넌트는 그리기만 한다
'use client';

import { FilterBar } from '@/components/common/filter-bar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_LABEL, PRIORITY_BADGE, TICKET_STATUS_BADGE } from '@/config/badge';
import { cn } from '@/lib/utils';
import type { FilterPatch } from './use-console-tickets';

/** Radix Select 는 빈 문자열을 값으로 쓸 수 없어 '전체'에 센티넬을 둔다 (member-admin 과 동일) */
const ALL = 'ALL';

const SLA_OPTIONS = { WARNING: '임박', BREACHED: '초과' };

interface TicketFilterBarProps {
  tab: string;
  canSeeAll: boolean;
  params: URLSearchParams;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
}

export function TicketFilterBar({
  tab,
  canSeeAll,
  params,
  keyword,
  onKeywordChange,
  onChange,
  onReset,
}: TicketFilterBarProps) {
  return (
    <>
      <Tabs value={tab} onValueChange={(value) => onChange({ tab: value })} className="mb-4">
        <TabsList>
          <TabsTrigger value="MINE">내 티켓</TabsTrigger>
          <TabsTrigger value="UNASSIGNED">미배정</TabsTrigger>
          {canSeeAll && <TabsTrigger value="ALL">전체</TabsTrigger>}
        </TabsList>
      </Tabs>

      <FilterBar onReset={onReset}>
        <FilterSelect
          label="상태"
          value={params.get('status')}
          options={labels(TICKET_STATUS_BADGE)}
          onChange={(v) => onChange({ status: v })}
        />
        <FilterSelect
          label="우선순위"
          value={params.get('priority')}
          options={labels(PRIORITY_BADGE)}
          onChange={(v) => onChange({ priority: v })}
        />
        <FilterSelect
          label="유형"
          value={params.get('category')}
          options={CATEGORY_LABEL}
          onChange={(v) => onChange({ category: v })}
        />
        <FilterSelect
          label="SLA"
          value={params.get('sla')}
          options={SLA_OPTIONS}
          onChange={(v) => onChange({ sla: v })}
        />
        <div>
          <Label htmlFor="keyword" className="sr-only">
            검색
          </Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="번호·제목·본문 검색"
            className="h-8 w-56"
          />
        </div>
      </FilterBar>
    </>
  );
}

/** {label, className} 배지 맵에서 라벨만 뽑는다 — 한글 라벨은 config/badge.ts 가 유일한 출처 */
function labels(badges: Record<string, { label: string }>): Record<string, string> {
  return Object.fromEntries(Object.entries(badges).map(([key, { label }]) => [key, label]));
}

interface FilterSelectProps {
  label: string;
  value: string | null;
  options: Record<string, string>;
  onChange: (value: string | undefined) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const id = `filter-${label}`;
  return (
    // 시안 A안: 점선 칩 안에 "라벨 값". 값을 고르면 실선으로 바뀐다
    <div>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger
          id={id}
          size="sm"
          className={cn('w-auto gap-1.5', value ? 'border-primary/40' : 'border-dashed')}
        >
          <span className="text-muted-foreground">{label}</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체</SelectItem>
          {Object.entries(options).map(([key, text]) => (
            <SelectItem key={key} value={key}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
