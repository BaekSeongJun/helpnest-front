// @owner SSJ
// AI-2 답변 초안 버튼 (docs/05 §4.3). 박민재 ReplyEditor 에서 <AiDraftButton ticketId={id} onInsert={...} /> 로 사용
'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2, RotateCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AiBadge } from '@/components/common/badges';
import { PlainText } from '@/components/common/plain-text';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createDraft } from '@/lib/api/ai';
import type { AiDraft } from '@/types/ai';

interface AiDraftButtonProps {
  ticketId: number;
  /** "에디터에 삽입" — draftId 는 발송 시 ticket_reply.ai_draft_id 로 기록 (05 §4.2) */
  onInsert: (text: string, draftId: number) => void;
}

const REFERENCE_LABEL: Record<AiDraft['references'][number]['type'], string> = {
  FAQ: 'FAQ',
  REPLY: '과거 답변',
};

export function AiDraftButton({ ticketId, onInsert }: AiDraftButtonProps) {
  const [open, setOpen] = useState(false);
  // 호출마다 AI_DRAFT 행이 생기므로 query 가 아닌 mutation (자동 재요청 방지)
  const mutation = useMutation({ mutationFn: () => createDraft(ticketId) });

  function start() {
    setOpen(true);
    mutation.mutate();
  }

  function insert(draft: AiDraft) {
    onInsert(draft.content, draft.draftId);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={start}>
        <Sparkles className="size-4" />
        AI 초안
      </Button>
      {/* 생성 중에는 닫지 않는다 (ConfirmDialog 와 같은 규칙) */}
      <Dialog open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              답변 초안
              <AiBadge />
            </DialogTitle>
            <DialogDescription>내용을 확인·수정한 뒤 발송하세요.</DialogDescription>
          </DialogHeader>

          {mutation.isPending ? (
            <div className="space-y-3" aria-busy>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                초안 작성 중 (최대 20초)
              </p>
              <LoadingSkeleton variant="detail" />
            </div>
          ) : mutation.isError ? (
            <ErrorState message={mutation.error.message} onRetry={() => mutation.mutate()} />
          ) : mutation.data ? (
            <DraftPreview draft={mutation.data} />
          ) : null}

          {mutation.isSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => mutation.mutate()}>
                <RotateCw className="size-4" />
                다시 생성
              </Button>
              <Button onClick={() => insert(mutation.data)}>에디터에 삽입</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DraftPreview({ draft }: { draft: AiDraft }) {
  return (
    <div className="space-y-4">
      <PlainText text={draft.content} className="bg-ai/5 border-ai/20 max-h-80 overflow-y-auto rounded-lg border p-3" />
      {draft.references.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">참고 자료</p>
          <ul className="space-y-1 text-sm">
            {draft.references.map((ref) => (
              <li key={`${ref.type}-${ref.id}`} className="flex items-center gap-2">
                <Badge variant="outline">{REFERENCE_LABEL[ref.type]}</Badge>
                <span className="truncate">{ref.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
