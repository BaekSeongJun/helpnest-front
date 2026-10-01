// @owner BSJ
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/common/badges';
import { FileUploader } from '@/components/common/file-uploader';
import { PlainText } from '@/components/common/plain-text';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORY_LABEL } from '@/config/badge';
import { downloadAttachment, uploadAttachments } from '@/lib/api/attachment';
import { ApiError } from '@/lib/api/client';
import { createCustomerReply, getTicket, ticketKeys } from '@/lib/api/ticket';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TicketAttachment, TicketReplyResponse, WriterType } from '@/types/ticket';

const CONTENT_MAX = 5000;

export function InquiryDetail({ ticketId }: { ticketId: number }) {
  return (
    <AuthGuard roles={['CUSTOMER']} guestTicketId={ticketId}>
      <InquiryDetailBody ticketId={ticketId} />
    </AuthGuard>
  );
}

function InquiryDetailBody({ ticketId }: { ticketId: number }) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => getTicket(ticketId),
  });

  if (isPending) return <LoadingSkeleton variant="detail" />;
  if (error) {
    if (error instanceof ApiError && error.status === 401) {
      return (
        <EmptyState
          title="조회 시간이 지났어요"
          description="보안을 위해 비회원 조회는 30분 동안만 유지돼요. 다시 조회해 주세요."
          action={
            <Button asChild>
              <Link href="/inquiry/lookup">다시 조회</Link>
            </Button>
          }
        />
      );
    }
    if (error instanceof ApiError && error.status === 404) {
      return <EmptyState title="문의를 찾을 수 없습니다" />;
    }
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono">{data.ticketNo}</span>
          <span aria-hidden>·</span>
          <span>{CATEGORY_LABEL[data.category]}</span>
          <span aria-hidden>·</span>
          <span>{formatDateTime(data.createdAt)} 접수</span>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="flex-1 text-2xl font-semibold break-words">{data.title}</h1>
          <StatusBadge status={data.status} />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <PlainText text={data.content} />
          <AttachmentList attachments={data.attachments} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">답변</h2>
        {/* ponytail: 박민재 TicketTimeline 이 나오면 이 목록을 <TicketTimeline replies={data.replies} /> 로 교체 */}
        <ReplyList replies={data.replies} />
      </section>

      {data.status === 'CLOSED' ? (
        <p className="text-muted-foreground bg-muted rounded-lg p-4 text-sm">
          종료된 문의입니다. 추가로 궁금한 점은{' '}
          <Link href="/inquiry/new" className="text-primary hover:underline">
            새 문의
          </Link>
          로 남겨 주세요.
        </p>
      ) : (
        <ReplyForm ticketId={ticketId} resolved={data.status === 'RESOLVED'} />
      )}
    </div>
  );
}

const WRITER_LABEL: Record<WriterType, string> = {
  CUSTOMER: '나',
  GUEST: '나',
  AGENT: '상담원',
  SYSTEM: '안내',
};

function ReplyList({ replies }: { replies: TicketReplyResponse[] }) {
  if (!replies.length) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        아직 답변이 없어요. 답변이 등록되면 알려 드릴게요.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {replies.map((r) => {
        const mine = r.writerType === 'CUSTOMER' || r.writerType === 'GUEST';
        return (
          <li
            key={r.replyId}
            className={cn('rounded-lg border p-4', mine ? 'bg-muted/40' : 'bg-card')}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">
                {mine
                  ? WRITER_LABEL[r.writerType]
                  : `${r.writerName} ${WRITER_LABEL[r.writerType]}`}
              </span>
              <span className="text-muted-foreground text-xs">{formatDateTime(r.createdAt)}</span>
            </div>
            <PlainText text={r.content} />
            <AttachmentList attachments={r.attachments} className="mt-3" />
          </li>
        );
      })}
    </ol>
  );
}

function AttachmentList({
  attachments,
  className,
}: {
  attachments: TicketAttachment[];
  className?: string;
}) {
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

/** 고객 추가 답글. RESOLVED 면 서버가 재문의(IN_PROGRESS)로 바꾼다 */
function ReplyForm({ ticketId, resolved }: { ticketId: number; resolved: boolean }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError('내용을 입력해 주세요');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const attachmentIds = files.length
        ? (await uploadAttachments(files)).map((a) => a.attachmentId)
        : undefined;
      await createCustomerReply(ticketId, { content: content.trim(), attachmentIds });
      setContent('');
      setFiles([]);
      toast.success(resolved ? '재문의를 남겼습니다' : '답글을 남겼습니다');
      await queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '답글을 남기지 못했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{resolved ? '재문의' : '추가 문의'}</CardTitle>
        {resolved && (
          <p className="text-muted-foreground text-sm">
            해결된 문의예요. 답글을 남기면 다시 처리 중으로 바뀌어 상담원이 확인해요.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <Textarea
            rows={4}
            maxLength={CONTENT_MAX}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="추가로 전할 내용을 적어 주세요."
            aria-label="답글 내용"
            aria-invalid={!!error}
            disabled={submitting}
          />
          <p className="text-muted-foreground text-right text-xs tabular-nums">
            {content.length.toLocaleString()} / {CONTENT_MAX.toLocaleString()}
          </p>
          <FileUploader files={files} onChange={setFiles} disabled={submitting} />
          {error && <FieldError>{error}</FieldError>}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? '보내는 중…' : resolved ? '재문의하기' : '답글 남기기'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
