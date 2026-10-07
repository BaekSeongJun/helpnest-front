// @owner PMJ
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CHAT_STATUS_BADGE } from '@/config/badge';
import { CHAT_WAIT_LIMIT_MS, cancelChat, convertChat, getChatRooms, requestChat } from '@/lib/api/chat';
import { getAccessToken } from '@/lib/api/client';
import { activateStomp, subscribeStomp } from '@/lib/ws/stompClient';
import type { ChatStatusPayload } from '@/types/chat';

/** 진행 중 방의 현재 상태. 없으면 null — 새로 시작할 수 있는 상태다 */
const CURRENT_KEY = ['chat', 'current'] as const;

/**
 * 진행 중(WAITING·OPEN) 방이 있으면 이어서 보여 준다. 새로고침·재방문에도 대기 순번을 잃지 않게
 * 하려는 것이다. 순번은 방 목록에 없어서 `requestChat` 을 다시 부르는데, 서버가 진행 중 방이 있으면
 * 새로 만들지 않고 그 방의 상태를 돌려주므로 안전하다.
 */
async function loadCurrent(): Promise<ChatStatusPayload | null> {
  const rooms = await getChatRooms();
  const active = rooms.find((r) => r.status === 'WAITING' || r.status === 'OPEN');
  return active ? requestChat() : null;
}

/**
 * CU-09 1:1 채팅 (FR-CHT-01·04·05).
 * [상담 시작] → 대기(순번·경과 시간) → 5분 초과 시 [문의로 남기기][계속 기다리기][나가기]
 * → 상담(상담원 이름·대화) → 종료. 상태 전환은 `/user/queue/chat-status` 푸시로 받는다.
 */
export function CustomerChat() {
  const queryClient = useQueryClient();
  const [convertedTicketNo, setConvertedTicketNo] = useState<string | null>(null);
  const current = useQuery({ queryKey: CURRENT_KEY, queryFn: loadCurrent });
  const setCurrent = (payload: ChatStatusPayload | null) => queryClient.setQueryData(CURRENT_KEY, payload);

  useEffect(() => {
    activateStomp(getAccessToken);
    return subscribeStomp<ChatStatusPayload>('/user/queue/chat-status', (payload) =>
      queryClient.setQueryData(CURRENT_KEY, payload),
    );
  }, [queryClient]);

  const start = useMutation({
    mutationFn: requestChat,
    onSuccess: (payload) => {
      setConvertedTicketNo(null);
      setCurrent(payload);
    },
    onError: (error) => toast.error(error.message),
  });

  const header = <PageHeader title="1:1 채팅 상담" description="상담원과 실시간으로 대화합니다." />;

  if (current.isPending) {
    return (
      <div>
        {header}
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }
  if (current.isError) {
    return (
      <div>
        {header}
        <ErrorState onRetry={() => current.refetch()} />
      </div>
    );
  }

  const room = current.data;
  const startButton = (
    <Button onClick={() => start.mutate()} disabled={start.isPending}>
      {start.isPending ? '연결 중…' : '상담 시작'}
    </Button>
  );

  if (convertedTicketNo) {
    return (
      <div>
        {header}
        <EmptyState
          icon={MessageCircle}
          title="문의로 접수했습니다"
          description={`티켓번호 ${convertedTicketNo} — 답변은 내 문의에서 확인할 수 있습니다.`}
          action={
            <Button asChild variant="outline">
              <Link href="/my/inquiries">내 문의로 가기</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!room || room.status === 'CANCELED' || room.status === 'CONVERTED') {
    return (
      <div>
        {header}
        <EmptyState
          icon={MessageCircle}
          title="상담원과 1:1로 대화해 보세요"
          description="상담원이 모두 상담 중이면 순서대로 연결해 드립니다."
          action={startButton}
        />
      </div>
    );
  }

  const waiting = room.status === 'WAITING' || room.status === 'TIMEOUT';
  const badge = CHAT_STATUS_BADGE[waiting ? 'WAITING' : room.status === 'OPEN' ? 'OPEN' : 'CLOSED'];

  return (
    <div className="flex flex-col gap-4">
      {header}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={badge.className}>{badge.label}</Badge>
        {room.status === 'OPEN' && <span className="text-sm">상담원 {room.agentName ?? ''} 님과 연결되었습니다.</span>}
        {room.status === 'CLOSED' && <span className="text-sm">상담이 종료되었습니다.</span>}
      </div>

      {waiting && (
        <WaitingPanel
          room={room}
          onConverted={(ticketNo) => {
            setConvertedTicketNo(ticketNo);
            setCurrent(null);
          }}
          onCanceled={() => setCurrent(null)}
        />
      )}

      <ChatWindow
        roomId={room.roomId}
        canSend={waiting || room.status === 'OPEN'}
        notice={
          waiting
            ? '기다리는 동안 남긴 메시지는 상담원에게 함께 전달되고, 문의로 남기면 문의 내용이 됩니다.'
            : undefined
        }
      />

      {room.status === 'CLOSED' && <div className="flex justify-center">{startButton}</div>}
    </div>
  );
}

interface WaitingPanelProps {
  room: ChatStatusPayload;
  onConverted: (ticketNo: string) => void;
  onCanceled: () => void;
}

/**
 * 대기 순번·경과 시간과 5분 초과 안내. 경과 시간은 `queuedAt` 기준 화면 타이머라 서버 시계와
 * 몇 초 어긋날 수 있다 — [문의로 남기기]는 서버가 5분을 다시 확인하고 아니면 거절한다.
 */
function WaitingPanel({ room, onConverted, onCanceled }: WaitingPanelProps) {
  const [now, setNow] = useState(() => Date.now());
  const [keepWaiting, setKeepWaiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMs = Math.max(0, now - new Date(room.queuedAt).getTime());
  const timedOut = room.status === 'TIMEOUT' || elapsedMs >= CHAT_WAIT_LIMIT_MS;

  const convert = useMutation({
    mutationFn: () => convertChat(room.roomId),
    onSuccess: ({ ticketNo }) => onConverted(ticketNo),
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>
          대기 순번 <strong className="tabular-nums">{room.position ?? '-'}</strong>번
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1 tabular-nums">
          <Clock className="size-4" aria-hidden />
          {formatElapsed(elapsedMs)} 경과
        </span>
      </div>

      {timedOut && !keepWaiting && (
        <div className="bg-warning/10 flex flex-col gap-3 rounded-md p-3" role="alert">
          <p className="text-sm">
            대기 시간이 5분을 넘었습니다. 남긴 메시지로 문의를 접수하면 답변을 메일과 내 문의에서 받을 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => convert.mutate()} disabled={convert.isPending}>
              문의로 남기기
            </Button>
            <Button size="sm" variant="outline" onClick={() => setKeepWaiting(true)}>
              계속 기다리기
            </Button>
          </div>
        </div>
      )}

      <div>
        <ConfirmDialog
          title="대기를 그만할까요?"
          description="나가면 대기 순번이 사라지고 남긴 메시지는 접수되지 않습니다."
          confirmText="나가기"
          destructive
          onConfirm={async () => {
            try {
              await cancelChat(room.roomId);
              onCanceled();
            } catch (error) {
              toast.error((error as Error).message);
              throw error;
            }
          }}
          trigger={
            <Button size="sm" variant="ghost">
              나가기
            </Button>
          }
        />
      </div>
    </div>
  );
}

/** 3분 07초 */
function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}분 ${seconds}초`;
}
