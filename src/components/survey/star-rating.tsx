// @owner BSJ
'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const STARS = [1, 2, 3, 4, 5] as const;
const LABELS = ['매우 불만족', '불만족', '보통', '만족', '매우 만족'] as const;

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

/**
 * 별점 1~5. 숨겨진 라디오 5개라서 화살표 키 이동·스크린리더 그룹 읽기가 브라우저 기본으로 된다.
 * 마우스를 올리면 그 별까지 미리 채워 보여 준다.
 */
export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-col items-center gap-2">
      <fieldset className="flex gap-1" onMouseLeave={() => setHover(0)} disabled={disabled}>
        <legend className="sr-only">만족도 별점</legend>
        {STARS.map((n) => (
          <label
            key={n}
            className="has-focus-visible:ring-ring/50 cursor-pointer rounded-md p-1 has-focus-visible:ring-3 has-disabled:cursor-not-allowed"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <Star
              className={cn(
                'size-9 transition-colors',
                n <= shown ? 'fill-warning text-warning' : 'text-muted-foreground',
              )}
              aria-hidden
            />
            <span className="sr-only">
              {n}점 {LABELS[n - 1]}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="text-muted-foreground h-5 text-sm" aria-live="polite">
        {shown ? LABELS[shown - 1] : '별을 눌러 점수를 선택해 주세요'}
      </p>
    </div>
  );
}
