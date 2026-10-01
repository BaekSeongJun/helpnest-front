// @owner BSJ
'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { downloadAttachment } from '@/lib/api/attachment';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { TicketAttachment } from '@/types/ticket';

interface FileListProps {
  attachments: TicketAttachment[];
  className?: string;
}

/**
 * 첨부 표시 + 다운로드 (08 §5.2). 권한은 서버가 판정하고(회원·Guest·상담원), 실패하면 토스트.
 * 사용: <FileList attachments={ticket.attachments} /> — 비어 있으면 아무것도 그리지 않는다
 */
export function FileList({ attachments, className }: FileListProps) {
  if (!attachments.length) return null;

  async function handleDownload(a: TicketAttachment) {
    try {
      await downloadAttachment(a.attachmentId, a.originalName);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : '파일을 받지 못했습니다');
    }
  }

  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {attachments.map((a) => (
        <li key={a.attachmentId}>
          <Button variant="outline" size="sm" onClick={() => handleDownload(a)}>
            <Download className="size-4" />
            <span className="max-w-48 truncate">{a.originalName}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
