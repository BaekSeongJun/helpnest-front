// @owner BSJ
'use client';

import { Footer } from './footer';
import { Header } from './header';
import { SidebarNav } from './sidebar-nav';
import { useConsoleShell } from './use-console-shell';

/** 시안 A안: 콘솔 = 헤더 + 240px 사이드바, 고객 = 상단 가로 메뉴 + 가운데 정렬 본문(768px) */
export function MainShell({ children }: { children: React.ReactNode }) {
  const isConsole = useConsoleShell();

  if (isConsole) {
    return (
      <>
        <Header />
        <div className="flex flex-1">
          <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 border-r md:block">
            <div className="sticky top-14">
              <SidebarNav />
            </div>
          </aside>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-14 md:px-6">{children}</main>
      <Footer />
    </>
  );
}
