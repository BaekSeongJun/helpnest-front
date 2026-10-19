// @owner BSJ
'use client';

import { Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/use-auth';

/**
 * 밝은/어두운 테마 전환. 선택은 next-themes 가 localStorage 에 저장한다.
 * 아이콘은 CSS(dark:)로 바꾼다 — 서버 렌더 때는 테마를 몰라서 상태로 고르면 하이드레이션이 어긋난다.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { status } = useAuth();
  // 비로그인 홈(소개 화면)은 항상 어두워서 전환할 것이 없다 (main-shell)
  const alwaysDark = usePathname() === '/' && status === 'anonymous';

  if (alwaysDark) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="bg-card"
      aria-label="밝은/어두운 테마 전환"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </Button>
  );
}
