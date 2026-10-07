// @owner PMJ
// 답변·내부 메모 타임라인 (09 §4). 백성준 CU-07 과 박민재 CS-02 가 함께 쓴다.
// GET /tickets/{id} 응답의 replies 를 변환 없이 그대로 넘기면 된다 — 정렬·필터는 이 컴포넌트가 책임진다.
//   CU-07(고객): <TicketTimeline replies={ticket.replies} />
//   CS-02(콘솔): <TicketTimeline replies={ticket.replies} showInternal />
// 본문은 PlainText(백성준)로만 그린다. dangerouslySetInnerHTML 금지 — 입력한 HTML 은 글자 그대로 보인다.

import { Lock } from 'lucide-react';
import { FileList } from '@/components/common/file-list';
import { PlainText } from '@/components/common/plain-text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TicketReplyResponse, WriterType } from '@/types/ticket';

interface TicketTimelineProps {
  replies: TicketReplyResponse[];
  /** 내부 메모 표시 여부. 기본 false — 고객 화면은 주지 않는다 */
  showInternal?: boolean;
  emptyText?: string;
  className?: string;
}

/** 시안 A안: 모두 왼쪽 정렬 대화형. 상담원 답변은 강조 배경, 아바타 색으로도 구분 */
const BOX: Record<WriterType, string> = {
  CUSTOMER: '',
  GUEST: '',
  AGENT: 'bg-accent',
  SYSTEM: '',
};

const AVATAR: Record<WriterType, string> = {
  CUSTOMER: 'bg-secondary text-secondary-foreground',
  GUEST: 'bg-secondary text-secondary-foreground',
  AGENT: 'bg-primary text-primary-foreground',
  SYSTEM: '',
};

export function TicketTimeline({
  replies,
  showInternal = false,
  emptyText = '아직 답변이 없습니다',
  className,
}: TicketTimelineProps) {
  // 내부 메모 제거는 표시 분기가 아니라 방어선이다. 고객용 API 가 애초에 내려주지 않지만
  // 백엔드 버그로 섞여 와도 고객 화면에는 나오지 않게 한다.
  // 정렬도 여기서 끝낸다 — 호출자가 신경 쓰지 않아도 되게 (ISO 문자열 비교 대신 시각으로 비교).
  const items = replies
    .filter((reply) => showInternal || !reply.isInternal)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  if (items.length === 0) {
    return (
      <p className={cn('text-muted-foreground py-8 text-center text-sm', className)}>{emptyText}</p>
    );
  }

  return (
    <ol className={cn('space-y-2', className)}>
      {items.map((reply) =>
        reply.writerType === 'SYSTEM' ? (
          <li
            key={reply.replyId}
            className="text-muted-foreground flex items-center justify-center gap-2 text-xs"
          >
            <span>{reply.content}</span>
            <TimeLabel at={reply.createdAt} />
          </li>
        ) : (
          <li
            key={reply.replyId}
            className={cn(
              'flex gap-3 rounded-lg p-4',
              BOX[reply.writerType],
              // 색만으로 구분하지 않는다 (08 §11) — 테두리와 함께 라벨을 반드시 붙인다
              reply.isInternal && 'bg-warning/10 border-warning/25 border',
            )}
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                AVATAR[reply.writerType],
              )}
              aria-hidden="true"
            >
              {reply.writerName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                {reply.isInternal && (
                  <span className="text-warning inline-flex items-center gap-1 font-semibold">
                    <Lock className="size-3.5" aria-hidden="true" />
                    내부 메모
                  </span>
                )}
                <span className="text-foreground text-sm font-semibold">{reply.writerName}</span>
                <TimeLabel at={reply.createdAt} />
              </div>
              <PlainText text={reply.content} />
              <FileList attachments={reply.attachments} />
            </div>
          </li>
        ),
      )}
    </ol>
  );
}

/** 상대시간을 보여주고 절대시간은 툴팁에. TooltipProvider 는 app/layout.tsx 에 이미 있다 */
function TimeLabel({ at }: { at: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* 서버·브라우저 렌더 시각이 분 경계에서 어긋날 수 있어 하이드레이션 경고만 끈다 */}
        <time dateTime={at} suppressHydrationWarning>
          {formatRelative(at)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(at)}</TooltipContent>
    </Tooltip>
  );
}
