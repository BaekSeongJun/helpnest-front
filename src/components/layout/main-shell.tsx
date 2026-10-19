// @owner BSJ
'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import { Header } from './header';
import { SidebarNav } from './sidebar-nav';
import { useConsoleShell } from './use-console-shell';

/**
 * 모든 화면이 같은 앱형 셸을 쓴다 (front #74): 헤더 + 240px 사이드바 + 본문.
 * 콘솔은 표가 넓어 본문을 전체 폭으로, 고객 화면은 글·폼이 대부분이라 1024px 로 묶어 가운데에 둔다
 * (넓은 모니터에서 한쪽만 비거나 입력칸이 끝까지 늘어나지 않게).
 * 모바일(md 미만)은 사이드바 대신 헤더의 Sheet 메뉴.
 */
export function MainShell({ children }: { children: React.ReactNode }) {
  const isConsole = useConsoleShell();
  const { status } = useAuth();
  // 비로그인 홈은 소개 화면이라 사이드바·폭 제한·여백 없이 전체 폭을 쓴다.
  // 이 화면만 테마 선택과 무관하게 항상 어둡다(.dark) — 전환 버튼도 여기서는 숨는다(ThemeToggle)
  const landing = usePathname() === '/' && status === 'anonymous';

  if (landing) {
    return (
      // 헤더를 완전히 투명하게 — 소개 화면의 배경이 헤더 뒤까지 끊김 없이 이어진다.
      // 투명한 채로 고정하면 스크롤 때 내용과 글자가 겹치므로 이 화면에서는 고정하지 않는다(relative)
      <div className="dark bg-background text-foreground flex flex-1 flex-col [&>header]:relative [&>header]:bg-transparent [&>header]:backdrop-blur-none">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="flex flex-1">
        {/* 사이드바는 바탕 위에 떠 있는 둥근 패널 — 내용 높이만큼만 차지한다 */}
        <aside className="hidden w-64 shrink-0 pb-4 pl-4 md:block">
          <div className="bg-sidebar sticky top-18 rounded-3xl">
            <SidebarNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:px-6 md:pt-2 md:pb-6">
          {isConsole ? children : <div className="mx-auto w-full max-w-5xl">{children}</div>}
        </main>
      </div>
    </>
  );
}
