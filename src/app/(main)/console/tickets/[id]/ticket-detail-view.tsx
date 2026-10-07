// @owner PMJ
// CS-02 티켓 상세 본체 (docs/09 §2.3). 좌: 본문·타임라인·답변 / 우: 상태·배정·SLA·이력
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AiAnalysisPanel } from '@/components/ai/AiAnalysisPanel';
import { AiDraftButton } from '@/components/ai/AiDraftButton';
import { FileList } from '@/components/common/file-list';
import { PlainText } from '@/components/common/plain-text';
import { PriorityBadge, SentimentBadge, SlaBadge, StatusBadge } from '@/components/common/badges';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { TemplatePicker } from '@/components/template/template-picker';
import { ReplyEditor, type ReplyEditorHandle } from '@/components/ticket/ReplyEditor';
import type { ReplyValues } from '@/components/ticket/schema';
import { TicketHistoryList } from '@/components/ticket/TicketHistoryList';
import { TicketSidePanel } from '@/components/ticket/TicketSidePanel';
import { TicketTimeline } from '@/components/ticket/TicketTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_LABEL } from '@/config/badge';
import {
  createConsoleReply,
  getConsoleTicket,
  getTicketHistories,
  ticketKeys,
} from '@/lib/api/ticket';
import { formatDateTime } from '@/lib/format';

export function TicketDetailView({ ticketId }: { ticketId: number }) {
  const queryClient = useQueryClient();
  const editorRef = useRef<ReplyEditorHandle>(null);

  // 어떤 초안을 썼는지 등록 때 함께 보낸다(ticket_reply.ai_draft_id, docs/05 §4.2).
  // 초안을 넣고 손으로 고쳐도 "이 초안에서 출발했다"는 사실은 그대로이므로 지우지 않는다.
  // 여러 번 생성했다면 마지막에 넣은 것이 실제로 쓰인 초안이다.
  const [aiDraftId, setAiDraftId] = useState<number | undefined>(undefined);

  // 상세와 이력을 두 쿼리로 나눈다 — 상태를 바꾸면 둘만 다시 받으면 되고, 상세 응답도 작아진다
  const detail = useQuery({
    queryKey: ticketKeys.consoleDetail(ticketId),
    queryFn: () => getConsoleTicket(ticketId),
  });
  const histories = useQuery({
    queryKey: ticketKeys.histories(ticketId),
    queryFn: () => getTicketHistories(ticketId),
  });

  const reply = useMutation({
    mutationFn: (values: ReplyValues) => createConsoleReply(ticketId, { ...values, aiDraftId }),
    // 낙관적 업데이트를 쓰지 않는다 — 공개 답변은 상태(ASSIGNED→IN_PROGRESS)와
    // firstRespondedAt 까지 함께 바꾸므로 서버 응답이 정확하다
    onSuccess: async (_created, values) => {
      toast.success(values.isInternal ? '내부 메모를 저장했습니다' : '답변을 등록했습니다');
      // 다음 답변이 앞 답변의 초안 id 를 물고 가지 않게 비운다
      setAiDraftId(undefined);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ticketKeys.consoleDetail(ticketId) }),
        queryClient.invalidateQueries({ queryKey: ticketKeys.histories(ticketId) }),
        queryClient.invalidateQueries({ queryKey: ['tickets', 'console', 'list'] }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <LoadingSkeleton variant="detail" />
        </div>
        <aside className="w-full shrink-0 lg:w-80">
          <LoadingSkeleton variant="detail" />
        </aside>
      </div>
    );
  }

  if (detail.isError) {
    // 404·403 도 백엔드 에러 코드 문구를 그대로 보여 준다
    return <ErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  }

  const ticket = detail.data;

  return (
    <div className="space-y-6">
      {/* 시안 A안: 경로 → 제목 → 배지 줄 */}
      <div className="space-y-2">
        <nav aria-label="경로" className="text-muted-foreground flex items-center gap-1 text-sm">
          <Link href="/console/tickets" className="hover:text-foreground">
            티켓
          </Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="font-mono text-xs">{ticket.ticketNo}</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">{ticket.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <SlaBadge
            dueAt={ticket.firstResponseDueAt}
            respondedAt={ticket.firstRespondedAt}
            breached={ticket.slaBreached}
            warning={ticket.slaWarned}
          />
          <SentimentBadge sentiment={ticket.sentiment} />
          <span className="text-muted-foreground text-sm">
            {ticket.customerName} · {formatDateTime(ticket.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          {/* 시안 A안: 고객 원문 → 답변·메모 → 작성기를 한 카드 안의 대화로 */}
          <Card>
            <CardContent className="space-y-6">
              <div className="flex gap-3 p-4">
                <span
                  className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  aria-hidden="true"
                >
                  {ticket.customerName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-foreground text-sm font-semibold">
                      {ticket.customerName}
                    </span>
                    <span>{formatDateTime(ticket.createdAt)}</span>
                    <span aria-hidden>·</span>
                    <span>{CATEGORY_LABEL[ticket.category] ?? ticket.category}</span>
                  </div>
                  <PlainText text={ticket.content} />
                  <FileList attachments={ticket.attachments} />
                </div>
              </div>
              {/* 콘솔이므로 내부 메모를 함께 본다 */}
              <TicketTimeline replies={ticket.replies} showInternal />
              <div className="border-t pt-5">
                <ReplyEditor
                  ref={editorRef}
                  onSubmit={(values) => reply.mutateAsync(values).then(() => undefined)}
                  submitting={reply.isPending}
                  toolbarSlot={
                    <>
                      <TemplatePicker
                        category={ticket.category}
                        customerName={ticket.customerName}
                        ticketNo={ticket.ticketNo}
                        onSelect={(text) => editorRef.current?.insertText(text)}
                      />
                      <AiDraftButton
                        ticketId={ticketId}
                        onInsert={(text, draftId) => {
                          editorRef.current?.insertText(text);
                          setAiDraftId(draftId);
                        }}
                      />
                    </>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:w-80">
          <TicketSidePanel ticket={ticket} />
          {/* 상태·배정 다음에 둔다 — 분류는 참고 정보이고, 상담원이 먼저 보는 것은
              "내 티켓인가·언제까지인가"다 (docs/09 §2.3 우측 패널 순서) */}
          <AiAnalysisPanel ticketId={ticketId} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">상태 이력</CardTitle>
            </CardHeader>
            <CardContent>
              {histories.isPending ? (
                <LoadingSkeleton variant="detail" />
              ) : histories.isError ? (
                <ErrorState
                  message={histories.error.message}
                  onRetry={() => void histories.refetch()}
                />
              ) : (
                <TicketHistoryList histories={histories.data} />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
