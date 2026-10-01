// @owner BSJ
// 화면 상태 패턴 (08 §7): 첫 로딩 → LoadingSkeleton, 데이터 없음 → EmptyState, 조회 실패 → ErrorState
'use client';

import { AlertCircle, Inbox, type LucideIcon, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** 다음 행동 버튼 (예: [문의하기]) */
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <Icon className="text-muted-foreground size-10" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center"
    >
      <AlertCircle className="text-destructive size-10" aria-hidden />
      <p className="font-medium">{message ?? '데이터를 불러오지 못했습니다.'}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw className="size-4" />
        다시 시도
      </Button>
    </div>
  );
}

interface LoadingSkeletonProps {
  variant: 'table' | 'card' | 'detail';
  /** table 행 수 / card 개수 */
  count?: number;
}

/** 스피너 단독 사용 금지 — 실제 레이아웃 모양의 뼈대를 보여준다 */
export function LoadingSkeleton({ variant, count }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-busy="true"
        aria-label="불러오는 중"
      >
        {Array.from({ length: count ?? 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }
  if (variant === 'detail') {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="불러오는 중">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }
  return (
    <div className="space-y-2" aria-busy="true" aria-label="불러오는 중">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: count ?? 5 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
