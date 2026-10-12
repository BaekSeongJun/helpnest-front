// @owner BSJ
'use client';

import { ChevronDown, LogOut, Menu, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE_LABEL } from '@/config/badge';
import { logout } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/use-auth';
import { AvailabilityToggle } from './availability-toggle';
import { Logo } from './logo';
import { useConsoleShell } from './use-console-shell';
import { NotificationBellSlot } from './notification-bell-slot';
import { SidebarNav } from './sidebar-nav';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  const { status, member } = useAuth();
  const router = useRouter();
  const isConsole = useConsoleShell();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    // 서버 폐기 실패여도 logout() 이 세션은 비운다
    await logout().catch(() => undefined);
    router.replace('/');
  }

  return (
    <header className="bg-background/90 sticky top-0 z-40 flex h-18 items-center gap-2 px-4 backdrop-blur md:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-sidebar w-60 gap-0 p-0">
          <SheetTitle className="flex h-14 items-center border-b px-4">
            <Logo className="text-lg" />
          </SheetTitle>
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link href="/" aria-label="HelpNest 홈" className="flex items-center gap-2 md:w-56">
        <Logo className="text-base" />
        {isConsole && <span className="text-muted-foreground text-xs">콘솔</span>}
      </Link>

      {/* 시안 A안: 콘솔 헤더 검색 → 티켓함 검색어로 이동 (LEAD+ 는 전체 탭) */}
      {isConsole && status === 'authenticated' && member && (
        <form
          role="search"
          className="text-muted-foreground bg-card focus-within:ring-ring/50 hidden h-11 max-w-md flex-1 items-center gap-2 rounded-full pr-1.5 pl-5 focus-within:ring-3 md:flex"
          onSubmit={(e) => {
            e.preventDefault();
            const keyword = new FormData(e.currentTarget).get('keyword')?.toString().trim();
            if (!keyword) return;
            const tab = member.role === 'AGENT' ? 'MINE' : 'ALL';
            router.push(`/console/tickets?${new URLSearchParams({ tab, keyword })}`);
          }}
        >
          <input
            name="keyword"
            placeholder="티켓 번호·제목·내용 검색"
            aria-label="티켓 검색"
            className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            aria-label="검색"
            className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
        </form>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {status === 'loading' && <Skeleton className="size-8 rounded-full" />}

        {status === 'anonymous' && (
          <>
            <Button asChild variant="ghost">
              <Link href="/login">로그인</Link>
            </Button>
            {/* 좁은 화면에서는 헤더가 넘쳐서 숨긴다 — 회원가입은 로그인 화면에서도 갈 수 있다 */}
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/signup">회원가입</Link>
            </Button>
          </>
        )}

        {status === 'authenticated' && member && (
          <>
            {member.role === 'AGENT' && <AvailabilityToggle available={member.available} />}
            <NotificationBellSlot />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="bg-card h-auto gap-2 rounded-full px-1 py-1 md:pr-3"
                  aria-label="사용자 메뉴"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                      {member.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  {isConsole && (
                    <>
                      <span className="hidden flex-col items-start leading-tight md:flex">
                        <span className="text-sm font-medium">{member.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {ROLE_LABEL[member.role]}
                        </span>
                      </span>
                      <ChevronDown className="text-muted-foreground hidden size-4 md:block" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-muted-foreground text-xs">{ROLE_LABEL[member.role]}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my/profile">
                    <User className="size-4" />내 정보
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="size-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
