// @owner BSJ
'use client';

import { LogOut, Menu, User } from 'lucide-react';
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
import { NotificationBellSlot } from './notification-bell-slot';
import { SidebarNav } from './sidebar-nav';

export function Header() {
  const { status, member } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    // 서버 폐기 실패여도 logout() 이 세션은 비운다
    await logout().catch(() => undefined);
    router.replace('/');
  }

  return (
    <header className="bg-background sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4">
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

      <Link href="/" aria-label="HelpNest 홈">
        <Logo className="text-lg" />
      </Link>

      <div className="ml-auto flex items-center gap-2">
        {status === 'loading' && <Skeleton className="size-8 rounded-full" />}

        {status === 'anonymous' && (
          <Button asChild size="sm">
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
                  size="icon"
                  className="rounded-full"
                  aria-label="사용자 메뉴"
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
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
