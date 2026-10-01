// @owner BSJ
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@/types/auth';
import { getGuestTicketId } from '@/lib/api/client';
import { useAuth } from './use-auth';

interface AuthGuardProps {
  /** 없으면 로그인만 확인. 역할 계층은 없으므로 허용 역할을 모두 적는다 (config/menu.ts 와 동일) */
  roles?: readonly Role[];
  /** 이 티켓의 Guest 토큰이 있으면 비로그인이어도 통과 (CU-07) */
  guestTicketId?: number;
  children: ReactNode;
}

/**
 * 클라이언트 라우트 가드 (FR-AUTH-04). 1차 확인은 proxy.ts(Refresh 쿠키 유무), 최종 판단은 여기서.
 * 세션 복원 중 → 스켈레톤, 비로그인 → /login?next=현재경로, 역할 불일치 → 403
 */
export function AuthGuard({ roles, guestTicketId, children }: AuthGuardProps) {
  const { status, member } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isGuest =
    status === 'anonymous' && guestTicketId !== undefined && getGuestTicketId() === guestTicketId;

  useEffect(() => {
    if (status === 'anonymous' && !isGuest) {
      // useSearchParams 대신 window 를 써서 Suspense 경계 없이 쿼리까지 보존
      const next = pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status, isGuest, pathname, router]);

  if (isGuest) return children;

  if (status !== 'authenticated' || !member) {
    return (
      <div className="space-y-3 p-6" aria-busy="true" aria-label="불러오는 중">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    );
  }

  if (roles && !roles.includes(member.role)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-lg font-semibold">접근 권한이 없습니다</p>
        <p className="text-muted-foreground text-sm">
          이 화면을 볼 수 있는 계정으로 로그인해 주세요.
        </p>
        <Button asChild variant="outline">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  return children;
}
