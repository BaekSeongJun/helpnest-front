// @owner PMJ
// SLA 정책 편집 (AD-04). 우선순위 4행 고정이라 목록 CRUD 가 아니다 — 추가·삭제가 없고
// 행마다 값 두 개를 고쳐 저장한다. 그래서 다이얼로그(AD-02 FAQ 방식) 대신 행 내 편집이다.
//
// 저장을 행 단위로 두는 이유는 API 가 `PUT /admin/sla-policies/{priority}` 로 우선순위 하나씩
// 받기 때문이다. 4행을 한 번에 보내는 화면을 만들면 요청 4개를 묶어야 하고, 그중 하나가
// 실패했을 때 "무엇이 저장되고 무엇이 안 됐는지"를 화면이 따로 설명해야 한다.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PRIORITY_BADGE } from '@/config/badge';
import { ApiError } from '@/lib/api/client';
import { getSlaPolicies, slaKeys, updateSlaPolicy, type SlaPolicy } from '@/lib/api/sla';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime, formatDuration } from '@/lib/format';
import type { TicketPriority } from '@/types/ticket';

/** 편집 중인 값. 입력 도중에는 숫자가 아닐 수 있어 문자열로 들고 있는다 */
type Draft = { responseMinutes: string; warningRatio: string };

export function SlaAdmin() {
  const { member } = useAuth();
  const canEdit = member?.role === 'ADMIN';
  const queryClient = useQueryClient();

  // 편집 중인 행만 담는다. 비어 있으면 서버 값을 그대로 보여 준다
  const [drafts, setDrafts] = useState<Partial<Record<TicketPriority, Draft>>>({});

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: slaKeys.all,
    queryFn: getSlaPolicies,
  });

  const save = useMutation({
    mutationFn: ({ priority, draft }: { priority: TicketPriority; draft: Draft }) =>
      updateSlaPolicy(priority, {
        responseMinutes: Number(draft.responseMinutes),
        warningRatio: Number(draft.warningRatio),
      }),
    onSuccess: async (_policy, { priority }) => {
      toast.success(`${PRIORITY_BADGE[priority].label} 정책을 저장했습니다`);
      // 임박 시각은 서버가 다시 계산해 주므로 응답을 캐시에 끼워 넣지 않고 전체를 다시 읽는다
      setDrafts((prev) => ({ ...prev, [priority]: undefined }));
      await queryClient.invalidateQueries({ queryKey: slaKeys.all });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '저장에 실패했습니다'),
  });

  function edit(priority: TicketPriority, patch: Partial<Draft>, policy: SlaPolicy) {
    setDrafts((prev) => ({
      ...prev,
      [priority]: { ...toDraft(policy), ...prev[priority], ...patch },
    }));
  }

  if (isPending) return <LoadingSkeleton variant="table" />;
  if (isError) {
    return <ErrorState message="SLA 정책을 불러오지 못했습니다." onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA 정책"
        description="우선순위별 첫 응답 기한과 임박 알림 시점을 설정합니다."
      />

      {!canEdit && (
        <p className="text-muted-foreground text-sm">
          수정은 관리자만 할 수 있습니다. 변경이 필요하면 관리자에게 요청해 주세요.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">우선순위</TableHead>
            <TableHead className="w-40">첫 응답 기한(분)</TableHead>
            <TableHead className="w-36">임박 비율</TableHead>
            <TableHead className="w-32">임박 시점</TableHead>
            <TableHead>마지막 수정</TableHead>
            {canEdit && <TableHead className="w-24" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((policy) => {
            const draft = drafts[policy.priority];
            const current = draft ?? toDraft(policy);
            const dirty = draft !== undefined && !sameAs(policy, draft);
            const pending = save.isPending && save.variables?.priority === policy.priority;

            return (
              <TableRow key={policy.priority}>
                <TableCell>
                  <Badge className={PRIORITY_BADGE[policy.priority].className}>
                    {PRIORITY_BADGE[policy.priority].label}
                  </Badge>
                </TableCell>

                <TableCell>
                  {canEdit ? (
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      aria-label={`${PRIORITY_BADGE[policy.priority].label} 첫 응답 기한(분)`}
                      value={current.responseMinutes}
                      onChange={(e) =>
                        edit(policy.priority, { responseMinutes: e.target.value }, policy)
                      }
                    />
                  ) : (
                    formatDuration(policy.responseMinutes)
                  )}
                </TableCell>

                <TableCell>
                  {canEdit ? (
                    // 상·하한과 소수 자릿수는 서버 검증(SlaPolicyUpdateRequest)과 같은 값이다.
                    // 여기서 넓히면 400 을 받고, 좁히면 서버가 허용하는 설정을 못 넣는다
                    <Input
                      type="number"
                      min={0.01}
                      max={1}
                      step={0.01}
                      inputMode="decimal"
                      aria-label={`${PRIORITY_BADGE[policy.priority].label} 임박 비율`}
                      value={current.warningRatio}
                      onChange={(e) =>
                        edit(policy.priority, { warningRatio: e.target.value }, policy)
                      }
                    />
                  ) : (
                    policy.warningRatio.toFixed(2)
                  )}
                </TableCell>

                {/* 서버가 계산해 준 값만 보여 준다. 편집 중인 값으로 다시 곱하면 저장 전에
                    화면이 실제 알림 시각과 다른 숫자를 말하게 된다 */}
                <TableCell className="text-muted-foreground">
                  {formatDuration(policy.warningMinutes)}
                  {dirty && <span className="ml-1 text-xs">(저장 후 갱신)</span>}
                </TableCell>

                <TableCell className="text-muted-foreground text-sm">
                  {formatDateTime(policy.updatedAt)}
                </TableCell>

                {canEdit && (
                  <TableCell>
                    <Button
                      size="sm"
                      disabled={!dirty || !valid(current) || pending}
                      onClick={() => save.mutate({ priority: policy.priority, draft: current })}
                    >
                      저장
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <p className="text-muted-foreground text-sm">
        임박 시점은 <strong>첫 응답 기한 × 임박 비율</strong>로 서버가 계산합니다. 비율 1.00 은 임박
        알림 없이 초과 알림만 받겠다는 뜻입니다. 바뀐 기한은 <strong>이후 접수되는 문의</strong>부터
        적용됩니다.
      </p>
    </div>
  );
}

function toDraft(policy: SlaPolicy): Draft {
  return {
    responseMinutes: String(policy.responseMinutes),
    warningRatio: policy.warningRatio.toFixed(2),
  };
}

/** 고쳤다가 되돌린 값은 저장할 것이 없다 — 버튼을 켜 두면 의미 없는 요청이 나간다 */
function sameAs(policy: SlaPolicy, draft: Draft): boolean {
  const saved = toDraft(policy);
  return (
    Number(saved.responseMinutes) === Number(draft.responseMinutes) &&
    Number(saved.warningRatio) === Number(draft.warningRatio)
  );
}

/**
 * 서버 검증과 같은 경계다(`SlaPolicyUpdateRequest`). 여기서 막는 것은 왕복을 아끼려는 것이고
 * 실제로 거절하는 쪽은 서버다 — 빈 칸이나 소수가 섞인 분이 숫자 변환을 통과해 나가지 않게 한다.
 */
function valid(draft: Draft): boolean {
  const minutes = Number(draft.responseMinutes);
  const ratio = Number(draft.warningRatio);
  return (
    draft.responseMinutes.trim() !== '' &&
    draft.warningRatio.trim() !== '' &&
    Number.isInteger(minutes) &&
    minutes >= 1 &&
    ratio >= 0.01 &&
    ratio <= 1
  );
}
