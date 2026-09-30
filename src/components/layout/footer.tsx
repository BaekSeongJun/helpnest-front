// @owner BSJ
'use client';

import { useAuth } from '@/lib/auth/use-auth';

/** 고객 화면만 (docs/08 §4). 상담원·팀장·관리자는 콘솔이라 숨긴다 */
export function Footer() {
  const { member } = useAuth();
  if (member && member.role !== 'CUSTOMER') return null;

  return (
    <footer className="text-muted-foreground border-t px-4 py-6 text-center text-xs">
      © HelpNest · AI 고객상담 헬프데스크
    </footer>
  );
}
