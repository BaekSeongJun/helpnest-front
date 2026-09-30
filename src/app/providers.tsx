// @owner BSJ
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { ApiError, getAuthSnapshot, refreshSession } from '@/lib/api/client';

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 4xx(권한·검증·없음)는 다시 시도해도 같으므로 재시도하지 않는다
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// 서버 렌더마다 새 클라이언트, 브라우저에선 하나를 재사용 (Next 16 TanStack Query 가이드)
function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  // 새로고침하면 메모리의 Access 가 사라지므로 Refresh 쿠키로 세션 복원 (FR-AUTH-01)
  useEffect(() => {
    if (getAuthSnapshot().status === 'loading') void refreshSession();
  }, []);

  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
