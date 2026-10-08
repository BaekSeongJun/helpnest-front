// @owner BSJ
'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';

/** 콘솔 셸(사이드바)인지. 직원 계정이거나 콘솔 경로면 콘솔 — 세션 복원 전에도 경로로 먼저 정해 깜빡임을 줄인다 */
export function useConsoleShell() {
  const { member } = useAuth();
  const pathname = usePathname();
  return (
    (member != null && member.role !== 'CUSTOMER') || /^\/(console|admin|dev)(\/|$)/.test(pathname)
  );
}
