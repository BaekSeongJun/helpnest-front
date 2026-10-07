// @owner PMJ
// CS-08 알림 패널 — Header 드롭다운 (docs/09 §2.3, API docs/04 §9).
//
// Popover 를 쓰고 DropdownMenu 를 쓰지 않는다. 목록 한 줄은 "메뉴 명령"이 아니라 읽음 처리와
// 이동을 함께 하는 항목이고, DropdownMenu 안에서는 방향키가 메뉴 이동에 묶여 스크롤이 막힌다.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
  type NotificationItem,
} from '@/lib/api/notification';
import { getAccessToken } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/use-auth';
import { formatRelative } from '@/lib/format';
import { activateStomp, deactivateStomp, subscribeStomp } from '@/lib/ws/stompClient';

export function NotificationBell() {
  const { status, member } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // 푸시 1건마다 목록과 미읽음 수를 함께 되살린다. 받은 알림을 캐시에 직접 끼워 넣지 않는
  // 이유는 배지 숫자가 서버에만 있어서다 — 둘을 따로 다루면 "배지는 3인데 목록은 2건"이 된다.
  //
  // 토큰 값이 아니라 `getAccessToken` 함수를 넘긴다 — 재연결 시점에 최신 토큰을 읽어야 하고
  // (재발급됐으면 예전 값으로는 CONNECT 가 거부된다) Access 토큰은 메모리에만 있다.
  useEffect(() => {
    if (status !== 'authenticated') return;
    activateStomp(getAccessToken);
    const unsubscribe = subscribeStomp<NotificationItem>('/user/queue/notifications', () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    return () => {
      unsubscribe();
      // 로그아웃하면 소켓도 닫는다. 두면 로그아웃한 탭에 알림이 계속 밀려든다.
      // 채팅 화면도 같은 소켓을 쓰지만(activateStomp 는 이미 연결돼 있으면 아무것도 하지 않는다)
      // 벨은 Header 에 늘 붙어 있어 이 정리는 로그아웃 때만 돈다 — 그때는 채팅도 끊겨야 맞다.
      // ponytail: 벨이 없는 레이아웃에 채팅을 두게 되면 활성화·해제를 세션 수준으로 올린다
      deactivateStomp();
    };
  }, [status, queryClient]);

  const unread = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    enabled: status === 'authenticated',
  });

  // 목록은 패널을 열 때만 가져온다. 벨만 떠 있는 동안 필요한 건 숫자 하나뿐이다
  const list = useQuery({
    queryKey: notificationKeys.list(false),
    queryFn: () => getNotifications(false),
    enabled: open && status === 'authenticated',
  });

  const readOne = useMutation({
    mutationFn: markNotificationRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });

  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });

  // 비로그인·비회원(Guest)에게는 벨 자체를 숨긴다. 서버가 Guest 토큰에 403 을 주므로
  // (NotificationController) 띄워 봐야 에러만 보인다
  if (status !== 'authenticated') return null;

  const count = unread.data?.unreadCount ?? 0;

  /**
   * 알림을 눌렀을 때. 읽음 처리는 보내 두고 이동은 기다리지 않는다 — 읽음 PATCH 가 느리다고
   * 화면 전환이 늦어지면 "눌렀는데 반응이 없다"가 된다. 실패해도 알림이 남아 있을 뿐이다.
   */
  function handleClick(item: NotificationItem) {
    readOne.mutate(item.notificationId);
    setOpen(false);
    if (item.ticketId === null) return;
    router.push(ticketPath(item.ticketId, member?.role));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={bellLabel(count)}>
          <Bell className="size-5" aria-hidden />
          {count > 0 && (
            // 숫자는 배지 안에 글자로도 들어간다 — 색·점만으로 구분하지 않는다(docs/08 §14)
            <span className="bg-destructive absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">알림</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={count === 0 || readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            모두 읽음
          </Button>
        </div>

        {list.isPending && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {list.isError && (
          <div className="p-4">
            <ErrorState message="알림을 불러오지 못했습니다." onRetry={() => void list.refetch()} />
          </div>
        )}

        {list.data?.length === 0 && (
          <div className="p-4">
            <EmptyState icon={Bell} title="새 알림이 없습니다" />
          </div>
        )}

        {list.data && list.data.length > 0 && (
          <ScrollArea className="max-h-96">
            <ul>
              {list.data.map((item) => (
                <li key={item.notificationId}>
                  <button
                    type="button"
                    onClick={() => handleClick(item)}
                    className="hover:bg-accent focus-visible:ring-ring w-full border-b px-4 py-3 text-left last:border-b-0 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <p className="text-sm">{item.message}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatRelative(item.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * 같은 티켓이라도 역할마다 볼 수 있는 화면이 다르다. 상담원을 고객 화면으로 보내면 담당
 * 티켓인데도 "내 문의"가 아니라 404 를 만난다 (백엔드 알림 메일의 링크 분기와 같은 규칙).
 */
function ticketPath(ticketId: number, role: string | undefined): string {
  return role === 'CUSTOMER' ? `/my/inquiries/${ticketId}` : `/console/tickets/${ticketId}`;
}

/** 스크린리더에는 숫자를 말로 읽어 준다 — 배지 색·위치는 전달되지 않는다 */
function bellLabel(count: number): string {
  return count > 0 ? `알림 ${count}건 (읽지 않음)` : '알림';
}
