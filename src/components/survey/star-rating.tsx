// @owner BSJ
'use client';

import { cn } from '@/lib/utils';

const STARS = [1, 2, 3, 4, 5] as const;
const LABELS = ['매우 불만족', '불만족', '보통', '만족', '매우 만족'] as const;

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

/**
 * 만족도 1~5. 숨겨진 라디오 5개라서 화살표 키 이동·스크린리더 그룹 읽기가 브라우저 기본으로 된다.
 * 시안 A안: 별 대신 숫자+문구 버튼 5칸, 고른 칸은 primary 로 채운다.
 */
export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  return (
    <fieldset className="grid grid-cols-5 gap-2" disabled={disabled}>
      <legend className="sr-only">만족도</legend>
      {STARS.map((n) => (
        <label
          key={n}
          className={cn(
            'has-focus-visible:ring-ring/50 flex cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-3.5 transition-colors has-focus-visible:ring-3 has-disabled:cursor-not-allowed has-disabled:opacity-60',
            value === n
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-muted border-input border',
          )}
        >
          <input
            type="radio"
            name="rating"
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="sr-only"
          />
          <span className="text-xl font-bold tabular-nums">{n}</span>
          <span className="text-center text-xs break-keep">{LABELS[n - 1]}</span>
        </label>
      ))}
    </fieldset>
  );
}
