// @owner SSJ
// AI-1 분류 결과 패널 (docs/05 §4.3). 박민재 티켓 상세 페이지에서 <AiAnalysisPanel ticketId={id} /> 로 사용
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, RotateCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PriorityBadge, SentimentBadge } from '@/components/common/badges';
import { PlainText } from '@/components/common/plain-text';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_LABEL } from '@/config/badge';
import { getAiResult, reclassify } from '@/lib/api/ai';
import { formatPercent } from '@/lib/format';
import type { AiResult } from '@/types/ai';

export const aiResultKey = (ticketId: number) => ['ai-result', ticketId] as const;

export function AiAnalysisPanel({ ticketId }: { ticketId: number }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: aiResultKey(ticketId), queryFn: () => getAiResult(ticketId) });
  const mutation = useMutation({
    mutationFn: () => reclassify(ticketId),
    // 응답이 곧 최신 결과라 다시 조회하지 않는다
    onSuccess: (result) => {
      queryClient.setQueryData(aiResultKey(ticketId), result);
      if (result.status === 'SUCCESS') toast.success('재분류 완료');
      else toast.error('AI 분류 실패 — 잠시 후 다시 시도');
    },
    onError: (error) => toast.error(error.message),
  });

  const reclassifyButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RotateCw className="size-4" />
      )}
      재분류
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        {/* 시안 A안: 푸시아 아이콘 + 제목 */}
        <CardTitle className="text-ai flex items-center gap-2 text-base">
          <Sparkles className="size-4" aria-hidden="true" />
          AI 분석
        </CardTitle>
        {query.isSuccess && <CardAction>{reclassifyButton}</CardAction>}
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <LoadingSkeleton variant="detail" />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        ) : query.data === null ? (
          <EmptyState
            icon={Sparkles}
            title="AI 분류 중"
            description="접수 직후 자동 분류 진행 중"
          />
        ) : query.data.status === 'FAILED' ? (
          <EmptyState
            icon={AlertCircle}
            title="AI 분류 실패"
            description="기본값(기타·보통)으로 처리됨"
          />
        ) : (
          <AiResultView result={query.data} />
        )}
      </CardContent>
    </Card>
  );
}

function AiResultView({ result }: { result: AiResult }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
      <dt className="text-muted-foreground">유형</dt>
      <dd>
        {result.category && (
          <span className="font-medium">{CATEGORY_LABEL[result.category] ?? result.category}</span>
        )}
      </dd>
      <dt className="text-muted-foreground">긴급도</dt>
      <dd className="flex items-center gap-2">
        {result.urgency && <PriorityBadge priority={result.urgency} />}
        <SentimentBadge sentiment={result.sentiment} />
      </dd>
      <dt className="text-muted-foreground">신뢰도</dt>
      <dd className="text-ai tabular-nums">
        {formatPercent(result.confidence == null ? null : result.confidence * 100)}
      </dd>
      <dt className="text-muted-foreground self-start">요약</dt>
      <dd>{result.summary && <PlainText text={result.summary} />}</dd>
    </dl>
  );
}
