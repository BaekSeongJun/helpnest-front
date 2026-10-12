// @owner BSJ
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getMenu } from '@/config/menu';
import { useAuth } from '@/lib/auth/use-auth';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** 역할별 메뉴 (config/menu.ts). 데스크톱 aside 와 모바일 Sheet 가 함께 쓴다 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { status, member } = useAuth();
  const pathname = usePathname();

  // 세션 복원 전에 비회원 메뉴를 그렸다가 바뀌는 깜빡임 방지
  if (status === 'loading') {
    return (
      <div className="space-y-2 p-3" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <nav aria-label="주 메뉴" className="space-y-3 p-3">
      {getMenu(member?.role ?? null).map((section, i) => (
        <div key={section.title ?? i} className="space-y-0.5">
          {section.title && (
            <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs">{section.title}</p>
          )}
          {section.items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-full px-3.5 text-sm transition-colors',
                  // 선택 메뉴는 주색으로 채운 알약
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
