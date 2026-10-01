// @owner PMJ
// CS-02 우측 패널 — SLA·상태 변경·배정 (docs/04 §7 권한, 09 §2.3).
//
// 전이 가능 여부를 프론트에서 판정하지 않는다. 전이표를 복제하면 백엔드와 어긋나고,
// 어긋난 쪽이 화면이면 상담원은 "되는데 안 된다"를 겪는다. 모든 상태를 후보로 내보내고
// 서버의 TICKET_INVALID_TRANSITION 메시지를 그대로 보여 준다.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SlaBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TICKET_STATUS_BADGE } from '@/config/badge';
import { getAdminMembers, memberKeys } from '@/lib/api/member';
import { assignTicket, autoAssignTicket, ticketKeys, updateTicketStatus } from '@/lib/api/ticket';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime } from '@/lib/format';
import type { TicketResponse, TicketStatus } from '@/types/ticket';

/** 되돌리기 어려운 전이는 확인을 받는다 (08 §7) */
const CONFIRM_REQUIRED: Partial<Record<TicketStatus, string>> = {
  RESOLVED: '해결 처리하면 고객에게 만족도 설문이 발송됩니다.',
  CLOSED: '종료하면 이 티켓에 더 이상 답변할 수 없습니다.',
};

export function TicketSidePanel({ ticket }: { ticket: TicketResponse }) {
  const { member } = useAuth();
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<TicketStatus | undefined>();
  const [confirming, setConfirming] = useState(false);
  const [agentId, setAgentId] = useState<string | undefined>();
  const [reassigning, setReassigning] = useState(false);

  const canAssign = member?.role === 'LEAD' || member?.role === 'ADMIN';

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ticketKeys.consoleDetail(ticket.ticketId) }),
      queryClient.invalidateQueries({ queryKey: ticketKeys.histories(ticket.ticketId) }),
      // 목록의 상태·담당·SLA 열도 함께 바뀐다
      queryClient.invalidateQueries({ queryKey: ['tickets', 'console', 'list'] }),
    ]);
  }

  const statusMutation = useMutation({
    mutationFn: (to: TicketStatus) => updateTicketStatus(ticket.ticketId, { toStatus: to }),
    onSuccess: async () => {
      toast.success('상태를 변경했습니다');
      setNextStatus(undefined);
      await invalidate();
    },
    // 불허 전이(TICKET_INVALID_TRANSITION)도 여기로 온다 — 서버 문구를 그대로 보여 준다
    onError: (error) => toast.error(error.message),
  });

  const assignMutation = useMutation({
    mutationFn: (id: number) => assignTicket(ticket.ticketId, { agentId: id }),
    onSuccess: async () => {
      toast.success('담당자를 지정했습니다');
      setAgentId(undefined);
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const autoAssignMutation = useMutation({
    mutationFn: () => autoAssignTicket(ticket.ticketId),
    onSuccess: async () => {
      toast.success('자동 배정을 실행했습니다');
      await invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  /**
   * 상담원 목록은 백성준 API 다. 호출만 한다 (01 §4.1-5).
   * ADMIN 전용이라 LEAD 는 403 을 받는다 — 실패하면 수동 배정을 막고 자동 배정만 남긴다.
   * retry 를 끄는 이유는 403 은 다시 요청해도 같기 때문이다.
   */
  const agents = useQuery({
    queryKey: memberKeys.admin({ role: 'AGENT' }),
    queryFn: () => getAdminMembers({ role: 'AGENT' }),
    enabled: canAssign,
    retry: false,
  });

  function submitStatus() {
    if (!nextStatus) return;
    // mutate 는 거절을 삼키므로 처리되지 않은 Promise 가 생기지 않는다
    if (CONFIRM_REQUIRED[nextStatus]) setConfirming(true);
    else statusMutation.mutate(nextStatus);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SLA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {/* CS-01 목록과 같은 컴포넌트 — 같은 티켓이 두 화면에서 다르게 보일 수 없다 */}
            <SlaBadge
              dueAt={ticket.firstResponseDueAt}
              respondedAt={ticket.firstRespondedAt}
              breached={ticket.slaBreached}
              warning={ticket.slaWarned}
            />
            {ticket.firstRespondedAt && <span className="text-muted-foreground">응답 완료</span>}
          </div>
          <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt>첫 응답 기한</dt>
            <dd>{formatDateTime(ticket.firstResponseDueAt)}</dd>
            <dt>첫 응답</dt>
            <dd>{ticket.firstRespondedAt ? formatDateTime(ticket.firstRespondedAt) : '-'}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">상태 변경</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="next-status" className="sr-only">
            변경할 상태
          </Label>
          <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as TicketStatus)}>
            <SelectTrigger id="next-status" className="w-full">
              <SelectValue placeholder="변경할 상태" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TICKET_STATUS_BADGE)
                .filter(([key]) => key !== ticket.status)
                .map(([key, style]) => (
                  <SelectItem key={key} value={key}>
                    {style.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            disabled={!nextStatus || statusMutation.isPending}
            onClick={submitStatus}
          >
            {statusMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            변경
          </Button>
        </CardContent>
      </Card>

      {canAssign && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">배정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agents.isError ? (
              <p className="text-muted-foreground text-xs">
                상담원 목록을 불러올 수 없어 자동 배정만 가능합니다.
              </p>
            ) : (
              <>
                <Label htmlFor="assign-agent" className="sr-only">
                  담당 상담원
                </Label>
                <Select value={agentId} onValueChange={setAgentId} disabled={agents.isPending}>
                  <SelectTrigger id="assign-agent" className="w-full">
                    <SelectValue placeholder={agents.isPending ? '불러오는 중…' : '상담원 선택'} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.data?.content.map((agent) => (
                      <SelectItem key={agent.memberId} value={String(agent.memberId)}>
                        {agent.name}
                        {!agent.available && ' (상담 불가)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!agentId || assignMutation.isPending}
                  onClick={() => {
                    // 이미 담당자가 있으면 재배정이라 확인을 받는다
                    if (ticket.agentId) setReassigning(true);
                    else assignMutation.mutate(Number(agentId));
                  }}
                >
                  {assignMutation.isPending && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}
                  {ticket.agentId ? '재배정' : '배정'}
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              className="w-full"
              disabled={autoAssignMutation.isPending}
              onClick={() => autoAssignMutation.mutate()}
            >
              {autoAssignMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Wand2 className="size-4" aria-hidden />
              )}
              자동 배정
            </Button>
          </CardContent>
        </Card>
      )}

      {/* S2: 신수진 AiAnalysisPanel 주입 자리 */}
      {/* S2: 백성준 CustomerHistoryPanel 주입 자리 */}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={nextStatus ? `${TICKET_STATUS_BADGE[nextStatus].label} 처리할까요?` : ''}
        description={nextStatus ? CONFIRM_REQUIRED[nextStatus] : undefined}
        confirmText="변경"
        // mutateAsync 는 실패하면 거절해 다이얼로그가 열린 채로 남는다
        onConfirm={async () => void (await statusMutation.mutateAsync(nextStatus as TicketStatus))}
      />
      <ConfirmDialog
        open={reassigning}
        onOpenChange={setReassigning}
        title="담당자를 바꿀까요?"
        description={`현재 담당자 ${ticket.agentName ?? '-'} 에서 변경됩니다.`}
        confirmText="재배정"
        destructive
        onConfirm={async () => void (await assignMutation.mutateAsync(Number(agentId)))}
      />
    </>
  );
}
