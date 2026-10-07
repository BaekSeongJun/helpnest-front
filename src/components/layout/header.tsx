// @owner BSJ
'use client';

import { ChevronDown, LogOut, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { getMenu } from '@/config/menu';
import { logout } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/use-auth';
import { cn } from '@/lib/utils';
import { AvailabilityToggle } from './availability-toggle';
import { Logo } from './logo';
import { useConsoleShell } from './use-console-shell';
import { NotificationBellSlot } from './notification-bell-slot';
import { SidebarNav } from './sidebar-nav';

export function Header() {
  const { status, member } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isConsole = useConsoleShell();
  const [menuOpen, setMenuOpen] = useState(false);
  // 고객 셸 상단 메뉴: 홈은 로고, 내 정보는 아바타 메뉴가 대신한다
  const topMenu = isConsole
    ? []
    : getMenu(member?.role ?? null)
        .flatMap((section) => section.items)
        .filter((item) => item.href !== '/' && item.href !== '/my/profile');

  async function handleLogout() {
    // 서버 폐기 실패여도 logout() 이 세션은 비운다
    await logout().catch(() => undefined);
    router.replace('/');
  }

  return (
    <header
      className={cn(
        'bg-background sticky top-0 z-40 flex h-14 items-center gap-2 border-b',
        isConsole ? 'px-4' : 'px-4 md:gap-6 md:px-6',
      )}
    >
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

      {topMenu.length > 0 && (
        <nav aria-label="주 메뉴" className="hidden gap-1 text-sm md:flex">
          {topMenu.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-8 items-center rounded-md px-2.5 transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2">
        {status === 'loading' && <Skeleton className="size-8 rounded-full" />}

        {status === 'anonymous' && (
          <Button asChild variant="outline">
            <Link href="/login">로그인</Link>
          </Button>
        )}

        {status === 'authenticated' && member && (
          <>
            {member.role === 'AGENT' && <AvailabilityToggle available={member.available} />}
            <NotificationBellSlot />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto gap-2 rounded-full px-1 py-1 md:rounded-md md:pr-2"
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
