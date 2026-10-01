// @owner PMJ
// CS-02 티켓 상세 본체 (docs/09 §2.3). 좌: 본문·타임라인·답변 / 우: 상태·배정·SLA·이력
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileList } from '@/components/common/file-list';
import { PlainText } from '@/components/common/plain-text';
import { PageHeader } from '@/components/common/page-header';
import { PriorityBadge, SentimentBadge, StatusBadge } from '@/components/common/badges';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { ReplyEditor } from '@/components/ticket/ReplyEditor';
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
    mutationFn: (values: ReplyValues) => createConsoleReply(ticketId, values),
    // 낙관적 업데이트를 쓰지 않는다 — 공개 답변은 상태(ASSIGNED→IN_PROGRESS)와
    // firstRespondedAt 까지 함께 바꾸므로 서버 응답이 정확하다
    onSuccess: async (_created, values) => {
      toast.success(values.isInternal ? '내부 메모를 저장했습니다' : '답변을 등록했습니다');
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
                onSubmit={(values) => reply.mutateAsync(values).then(() => undefined)}
                submitting={reply.isPending}
                /* S2: toolbarSlot 에 TemplatePicker(백성준)·AiDraftButton(신수진) 주입 */
              />
            </CardContent>
          </Card>
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:w-80">
          <TicketSidePanel ticket={ticket} />
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
