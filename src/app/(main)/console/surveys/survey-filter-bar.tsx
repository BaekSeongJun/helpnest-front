// @owner BSJ
// CS-06 필터 바. 값은 전부 URL 에 있고 이 컴포넌트는 그리기만 한다
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
import { CATEGORY_LABEL } from '@/config/badge';
import type { ConsoleAgent } from '@/lib/api/console-agent';
import type { FilterPatch } from './use-survey-results';

/** Radix Select 는 빈 문자열을 값으로 쓸 수 없어 '전체'에 센티넬을 둔다 (콘솔 티켓함과 동일) */
const ALL = 'ALL';

const RATING_OPTIONS = { '5': '5점', '4': '4점', '3': '3점', '2': '2점', '1': '1점' };

interface SurveyFilterBarProps {
  params: URLSearchParams;
  canSeeAll: boolean;
  agents: ConsoleAgent[];
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
}

export function SurveyFilterBar({
  params,
  canSeeAll,
  agents,
  onChange,
  onReset,
}: SurveyFilterBarProps) {
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  return (
    <FilterBar onReset={onReset}>
      {/* 기간은 설문을 보낸 날 기준 — 응답률의 분모(발송)와 분자(응답)를 같은 집단으로 맞추기 위해서다 */}
      <div className="grid gap-1.5">
        <Label htmlFor="survey-from" className="text-muted-foreground text-xs">
          발송 시작일
        </Label>
        <Input
          id="survey-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onChange({ from: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="survey-to" className="text-muted-foreground text-xs">
          발송 종료일
        </Label>
        <Input
          id="survey-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onChange({ to: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      <FilterSelect
        label="별점"
        value={params.get('rating')}
        options={RATING_OPTIONS}
        onChange={(v) => onChange({ rating: v })}
      />
      <FilterSelect
        label="유형"
        value={params.get('category')}
        options={CATEGORY_LABEL}
        onChange={(v) => onChange({ category: v })}
      />
      {canSeeAll && (
        <FilterSelect
          label="상담원"
          value={params.get('agentId')}
          options={Object.fromEntries(agents.map((a) => [String(a.memberId), a.name]))}
          onChange={(v) => onChange({ agentId: v })}
        />
      )}
    </FilterBar>
  );
}

interface FilterSelectProps {
  label: string;
  value: string | null;
  options: Record<string, string>;
  onChange: (value: string | undefined) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const id = `survey-filter-${label}`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger id={id} size="sm" className="w-32">
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
