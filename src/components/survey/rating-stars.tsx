// @owner BSJ
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 읽기 전용 별점 표시 (결과 표). 입력용은 StarRating */
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${rating}점`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'size-4',
            n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground',
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}
