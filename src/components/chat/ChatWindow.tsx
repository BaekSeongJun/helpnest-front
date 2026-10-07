// @owner PMJ
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { SendHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { PlainText } from '@/components/common/plain-text';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CHAT_MESSAGE_MAX_LENGTH, getChatMessages } from '@/lib/api/chat';
import { getAccessToken } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { activateStomp, publishStomp, subscribeStomp } from '@/lib/ws/stompClient';
import type { ChatError, ChatMessage } from '@/types/chat';

const PAGE_SIZE = 50;

interface ChatWindowProps {
  roomId: number;
  /** false 면 입력창 대신 안내만 보인다(종료된 방 등) */
  canSend: boolean;
  /** 입력창 위에 보일 안내. 대기 중 메시지가 어디로 가는지처럼 상황 설명용 */
  notice?: string;
  /** 상담원 콘솔이 템플릿을 끼워 넣을 수 있게 입력값 제어를 밖으로 연다 */
  draft?: string;
  onDraftChange?: (value: string) => void;
}

/**
 * 1:1 채팅 대화창 (CU-09 고객, CS-03 상담원 공용, FR-CHT-02).
 *
 * ## 메시지는 두 곳에서 온다
 * - **이전 메시지**: REST 로 최신 50건, 위로 더 보기는 `before` 커서. 재접속하면 다시 읽는다.
 * - **실시간**: `/topic/chat/{roomId}` 푸시를 화면 상태에 덧붙인다.
 *
 * 구독을 먼저 걸고 이력을 읽으므로 두 경로에 같은 메시지가 겹칠 수 있다 — `messageId` 로 한 번만
 * 그린다. 이력을 먼저 읽고 구독하면 그 사이에 온 메시지를 영영 놓치므로 겹침 쪽을 택했다.
 *
 * 본문은 {@link PlainText}(텍스트 노드)로만 그린다 — `<script>` 를 보내도 글자로 보인다.
 */
export function ChatWindow({ roomId, canSend, notice, draft, onDraftChange }: ChatWindowProps) {
  const { member } = useAuth();
  const [live, setLive] = useState<ChatMessage[]>([]);
  const [ownDraft, setOwnDraft] = useState('');
  const value = draft ?? ownDraft;
  const setValue = onDraftChange ?? setOwnDraft;
  const bottomRef = useRef<HTMLDivElement>(null);

  // 방이 바뀌면 이전 방의 실시간 메시지를 버린다(상담원 콘솔에서 방을 옮겨 다닐 때)
  const [liveRoomId, setLiveRoomId] = useState(roomId);
  if (liveRoomId !== roomId) {
    setLiveRoomId(roomId);
    setLive([]);
  }

  useEffect(() => {
    activateStomp(getAccessToken);
    const offMessage = subscribeStomp<ChatMessage>(`/topic/chat/${roomId}`, (message) =>
      setLive((prev) => [...prev, message]),
    );
    const offError = subscribeStomp<ChatError>('/user/queue/errors', (error) => toast.error(error.message));
    return () => {
      offMessage();
      offError();
    };
  }, [roomId]);

  const history = useInfiniteQuery({
    queryKey: ['chat', 'messages', roomId],
    queryFn: ({ pageParam }) => getChatMessages(roomId, pageParam, PAGE_SIZE),
    initialPageParam: undefined as number | undefined,
    // 꽉 찬 페이지면 더 있을 수 있다. 각 페이지는 오래된 순이라 [0] 이 그 페이지에서 가장 오래된 것
    getNextPageParam: (page) => (page.length === PAGE_SIZE ? page[0].messageId : undefined),
    // 실시간 메시지가 화면 상태에 있으므로 캐시를 오래 들고 있을 이유가 없다. 다시 열면 새로 읽는다
    gcTime: 0,
  });

  const messages = useMemo(() => {
    const older = [...(history.data?.pages ?? [])].reverse().flat();
    const seen = new Set<number>();
    return [...older, ...live].filter((m) => !seen.has(m.messageId) && seen.add(m.messageId));
  }, [history.data, live]);

  // 처음 열었을 때와 새 메시지가 올 때만 맨 아래로. "이전 메시지 더 보기"는 페이지 수만 늘어
  // 이 두 값이 그대로라 읽던 위치가 튀지 않는다
  const firstPageLoaded = history.data?.pages.length === 1;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [live.length, firstPageLoaded]);

  function send() {
    const content = value.trim();
    if (!content || content.length > CHAT_MESSAGE_MAX_LENGTH) return;
    if (publishStomp(`/app/chat/${roomId}/send`, { content })) {
      setValue('');
    } else {
      toast.error('연결이 끊겨 보내지 못했습니다. 잠시 후 다시 보내 주세요.');
    }
  }

  // 한글 조합 중 Enter 는 글자 확정이지 전송이 아니다 — 막지 않으면 마지막 글자가 따로 한 번 더 간다
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  if (history.isPending) return <LoadingSkeleton variant="detail" />;
  if (history.isError) return <ErrorState message="메시지를 불러오지 못했습니다." onRetry={() => history.refetch()} />;

  const tooLong = value.length > CHAT_MESSAGE_MAX_LENGTH;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card h-96 overflow-y-auto rounded-lg border p-4" aria-live="polite">
        {history.hasNextPage && (
          <div className="mb-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => history.fetchNextPage()}
              disabled={history.isFetchingNextPage}
            >
              {history.isFetchingNextPage ? '불러오는 중…' : '이전 메시지 더 보기'}
            </Button>
          </div>
        )}
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">아직 메시지가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => {
              const mine = m.senderId === member?.memberId;
              return (
                <li key={m.messageId} className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
                  <span className="text-muted-foreground text-xs">
                    {mine ? '나' : (m.senderName ?? '알 수 없음')} · {formatDateTime(m.createdAt)}
                  </span>
                  <PlainText
                    text={m.content}
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2',
                      mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  />
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {notice && <p className="text-muted-foreground text-sm">{notice}</p>}

      {canSend ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-2">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="메시지를 입력하세요 (Shift+Enter 줄바꿈)"
              aria-label="메시지 입력"
              rows={2}
              className="resize-none"
            />
            <Button onClick={send} disabled={!value.trim() || tooLong} aria-label="보내기">
              <SendHorizontal />
            </Button>
          </div>
          <span className={cn('text-muted-foreground self-end text-xs tabular-nums', tooLong && 'text-destructive')}>
            {formatNumber(value.length)}/{formatNumber(CHAT_MESSAGE_MAX_LENGTH)}
          </span>
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-sm">메시지를 보낼 수 없는 상태입니다.</p>
      )}
    </div>
  );
}
