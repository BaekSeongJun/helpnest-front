// @owner PMJ
// 첨부 파일 목록. 티켓 본문(CS-02)과 답변(TicketTimeline) 양쪽이 쓴다.
//
// TODO(PMJ): 백성준 FileList(08 §5.2) 머지 후 교체. 지금 다운로드 링크를 걸지 않는 이유는
// GET /api/attachments/{id}/download 가 Bearer 토큰을 요구하는데(SecurityConfig anyRequest
// authenticated) 액세스 토큰이 client.ts 의 모듈 변수라 내보내는 접근자가 없어서다 —
// <a href> 로는 401 이 난다. 토큰을 쓰는 다운로드 헬퍼는 client.ts(백성준 소유)에 필요하므로 CR 대상.

import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TicketAttachment } from '@/types/ticket';

export function TicketAttachments({
  items,
  className,
}: {
  items: TicketAttachment[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <ul className={cn('text-muted-foreground space-y-0.5 text-xs', className)}>
      {items.map((file) => (
        <li key={file.attachmentId} className="flex items-center gap-1">
          <Paperclip className="size-3 shrink-0" aria-hidden />
          {file.originalName}
        </li>
      ))}
    </ul>
  );
}
