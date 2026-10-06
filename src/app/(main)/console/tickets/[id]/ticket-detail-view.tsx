// @owner PMJ
// CS-02 티켓 상세 본체 (docs/09 §2.3). 좌: 본문·타임라인·답변 / 우: 상태·배정·SLA·이력
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AiAnalysisPanel } from '@/components/ai/AiAnalysisPanel';
import { AiDraftButton } from '@/components/ai/AiDraftButton';
import { FileList } from '@/components/common/file-list';
import { PlainText } from '@/components/common/plain-text';
import { PageHeader } from '@/components/common/page-header';
import { PriorityBadge, SentimentBadge, StatusBadge } from '@/components/common/badges';
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
      <PageHeader
        title={ticket.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{ticket.ticketNo}</span>
            <span aria-hidden>·</span>
            <span>{ticket.customerName}</span>
            <span aria-hidden>·</span>
            <span>{formatDateTime(ticket.createdAt)}</span>
          </span>
        }
        actions={
          <>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SentimentBadge sentiment={ticket.sentiment} />
          </>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                문의 내용
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  {CATEGORY_LABEL[ticket.category] ?? ticket.category}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PlainText text={ticket.content} />
              <FileList attachments={ticket.attachments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">답변</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 콘솔이므로 내부 메모를 함께 본다 */}
              <TicketTimeline replies={ticket.replies} showInternal />
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
