// @owner BSJ
'use client';

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

  return (
    <>
      <Header />
      <div className="flex flex-1">
        <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 border-r md:block">
          <div className="sticky top-14">
            <SidebarNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          {isConsole ? children : <div className="mx-auto w-full max-w-5xl">{children}</div>}
        </main>
      </div>
    </>
  );
}
