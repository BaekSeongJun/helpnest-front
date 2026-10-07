// @owner PMJ
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagesSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { PriorityBadge, SlaBadge, StatusBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { TemplatePicker } from '@/components/template/template-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABEL, CHAT_STATUS_BADGE } from '@/config/badge';
import { chatKeys, closeChat, getChatRooms } from '@/lib/api/chat';
import { getAccessToken } from '@/lib/api/client';
import { getConsoleTicket, ticketKeys } from '@/lib/api/ticket';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { activateStomp, subscribeStomp } from '@/lib/ws/stompClient';
import type { ChatRoom } from '@/types/chat';
import type { ConsoleTicketEvent } from '@/types/ticket';

/**
 * CS-03 채팅 상담 (FR-CHT-02·03). 좌: 내 채팅방, 우: 대화창 + 고객·티켓 정보 + [템플릿] [종료·해결].
 *
 * 상담원에게 오는 방은 이미 연결된 방(OPEN)뿐이다 — 대기열 배정은 서버가 하고, 연결되면 기존
 * 배정 알림(ASSIGNED)이 온다. 그래서 개인 알림이 올 때마다 목록을 다시 불러 새 방을 띄운다.
 */
export function AgentChatConsole() {
  const queryClient = useQueryClient();
  const rooms = useQuery({ queryKey: chatKeys.rooms, queryFn: getChatRooms });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    activateStomp(getAccessToken);
    return subscribeStomp('/user/queue/notifications', () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
    });
  }, [queryClient]);

  const header = <PageHeader title="채팅 상담" description="연결된 고객과 실시간으로 대화합니다." />;

  if (rooms.isPending) {
    return (
      <div>
        {header}
        <LoadingSkeleton variant="table" />
      </div>
    );
  }
  if (rooms.isError) {
    return (
      <div>
        {header}
        <ErrorState onRetry={() => rooms.refetch()} />
      </div>
    );
  }

  // 상담 중인 방을 위로. 같은 상태 안에서는 서버 순서(최신순)를 유지한다
  const sorted = [...rooms.data].sort((a, b) => Number(b.status === 'OPEN') - Number(a.status === 'OPEN'));
  // 고른 방이 없으면 상담 중인 첫 방을 연다 — 새 상담이 들어왔을 때 한 번 더 누르지 않게
  const selected = sorted.find((r) => r.roomId === selectedId) ?? sorted.find((r) => r.status === 'OPEN') ?? null;

  if (sorted.length === 0) {
    return (
      <div>
        {header}
        <EmptyState
          icon={MessagesSquare}
          title="연결된 채팅이 없습니다"
          description="상담 가능 상태이면 대기 중인 고객이 순서대로 연결됩니다."
        />
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <RoomList rooms={sorted} selectedId={selected?.roomId ?? null} onSelect={setSelectedId} />
        {selected ? (
          <RoomPanel key={selected.roomId} room={selected} />
        ) : (
          <EmptyState icon={MessagesSquare} title="대화를 선택해 주세요" />
        )}
      </div>
    </div>
  );
}

function RoomList({
  rooms,
  selectedId,
  onSelect,
}: {
  rooms: ChatRoom[];
  selectedId: number | null;
  onSelect: (roomId: number) => void;
}) {
  return (
    <nav aria-label="내 채팅방" className="bg-card max-h-[32rem] overflow-y-auto rounded-lg border">
      <ul>
        {rooms.map((room) => {
          const badge = CHAT_STATUS_BADGE[room.status === 'OPEN' ? 'OPEN' : 'CLOSED'];
          return (
            <li key={room.roomId}>
              <button
                type="button"
                onClick={() => onSelect(room.roomId)}
                aria-current={room.roomId === selectedId ? 'true' : undefined}
                className={cn(
                  'hover:bg-muted flex w-full flex-col gap-1 border-b px-4 py-3 text-left last:border-b-0',
                  room.roomId === selectedId && 'bg-muted',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{room.customerName ?? '고객'}</span>
                  <Badge className={badge.className}>{badge.label}</Badge>
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(room.openedAt ?? room.queuedAt)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * 선택한 방. 템플릿은 대화창 입력값에 이어 붙인다 — 그래서 ChatWindow 의 입력값을 여기서 들고 있다.
 * 방을 바꾸면 `key` 로 새로 그려 다른 고객에게 쓰던 문장이 따라오지 않게 한다.
 */
function RoomPanel({ room }: { room: ChatRoom }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const open = room.status === 'OPEN';

  const ticket = useQuery({
    queryKey: ticketKeys.consoleDetail(room.ticketId ?? 0),
    queryFn: () => getConsoleTicket(room.ticketId!),
    enabled: room.ticketId !== null,
  });

  // 첫 메시지로 IN_PROGRESS 가 되거나 종료로 RESOLVED 가 되면 서버가 콘솔 신호를 보낸다 —
  // 이 방의 티켓이면 다시 읽어 상태·SLA 배지를 맞춘다(SLA 배지는 첫 응답이 기록되면 사라진다)
  useEffect(() => {
    if (room.ticketId === null) return;
    return subscribeStomp<ConsoleTicketEvent>('/topic/console/tickets', (event) => {
      if (event.ticketId === room.ticketId) {
        void queryClient.invalidateQueries({ queryKey: ticketKeys.consoleDetail(room.ticketId) });
      }
    });
  }, [room.ticketId, queryClient]);

  const close = useMutation({
    mutationFn: () => closeChat(room.roomId, true),
    onSuccess: () => {
      toast.success('상담을 종료하고 해결 처리했습니다');
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });

  const t = ticket.data;

  return (
    <section aria-label={`${room.customerName ?? '고객'} 님과의 대화`} className="flex flex-col gap-4">
      <div className="bg-card flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          <p className="font-medium">{room.customerName ?? '고객'} 님</p>
          {t ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/console/tickets/${t.ticketId}`} className="text-primary font-mono text-xs underline">
                {t.ticketNo}
              </Link>
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              <span className="text-muted-foreground">{CATEGORY_LABEL[t.category]}</span>
              <SlaBadge
                dueAt={t.firstResponseDueAt}
                respondedAt={t.firstRespondedAt}
                breached={t.slaBreached}
                warning={t.slaWarned}
              />
            </div>
          ) : ticket.isError ? (
            <p className="text-muted-foreground text-sm">티켓 정보를 불러오지 못했습니다.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <TemplatePicker
            category={t?.category}
            customerName={room.customerName}
            ticketNo={t?.ticketNo}
            onSelect={(text) => setDraft((prev) => prev + text)}
            disabled={!open}
          />
          <ConfirmDialog
            title="상담을 종료할까요?"
            description="채팅을 닫고 티켓을 해결 처리합니다. 고객에게 결과 메일과 만족도 설문이 발송됩니다."
            confirmText="종료·해결"
            onConfirm={() => close.mutateAsync()}
            trigger={
              <Button variant="outline" disabled={!open || close.isPending}>
                종료·해결
              </Button>
            }
          />
        </div>
      </div>

      <ChatWindow roomId={room.roomId} canSend={open} draft={draft} onDraftChange={setDraft} />
    </section>
  );
}
