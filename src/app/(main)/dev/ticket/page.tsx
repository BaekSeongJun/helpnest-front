// @owner PMJ
// TicketTimeline·ReplyEditor 확인용 (개발 전용, 운영 빌드에서는 404). dev/ui(백성준) 페이지와 같은 방식.
// 수용 기준 3개를 눈으로 확인한다:
//   (1) showInternal 없이 넘기면 isInternal 항목이 DOM 에 아예 없다
//   (2) <script>alert(1)</script> 가 글자 그대로 보이고 실행되지 않는다
//   (3) 5,001자를 넣으면 제출이 막히고 '5,000자까지 입력할 수 있어요' 가 뜬다
'use client';

import { notFound } from 'next/navigation';
import { toast } from 'sonner';
import { ReplyEditor } from '@/components/ticket/ReplyEditor';
import { TicketTimeline } from '@/components/ticket/TicketTimeline';
import { Button } from '@/components/ui/button';
import type { TicketReplyResponse } from '@/types/ticket';

const XSS =
  '<script>alert(1)</script>\n<img src=x onerror=alert(2)>\nhttps://helpnest.example/ticket/1';

// createdAt 을 일부러 역순으로 둔다 — 컴포넌트가 정렬을 책임지는지 확인하려고
const SAMPLE: TicketReplyResponse[] = [
  {
    replyId: 3,
    writerType: 'AGENT',
    writerName: '박민재',
    content: '확인 후 바로 처리해 드리겠습니다.',
    isInternal: false,
    attachments: [{ attachmentId: 1, originalName: '처리내역.pdf', size: 1024 }],
    createdAt: '2026-10-01T11:00:00+09:00',
  },
  {
    replyId: 1,
    writerType: 'CUSTOMER',
    writerName: '김고객',
    content: XSS,
    isInternal: false,
    attachments: [],
    createdAt: '2026-10-01T09:00:00+09:00',
  },
  {
    replyId: 4,
    writerType: 'AGENT',
    writerName: '박민재',
    content: '배송사 확인 필요. 고객에게 보이면 안 되는 메모.',
    isInternal: true,
    attachments: [],
    createdAt: '2026-10-01T11:30:00+09:00',
  },
  {
    replyId: 2,
    writerType: 'SYSTEM',
    writerName: '시스템',
    content: '상태가 처리중으로 변경되었습니다',
    isInternal: false,
    attachments: [],
    createdAt: '2026-10-01T10:00:00+09:00',
  },
];

export default function DevTicketPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          TicketTimeline — 고객 화면(showInternal 없음): 내부 메모 1건이 보이면 안 됨
        </h2>
        <TicketTimeline replies={SAMPLE} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">TicketTimeline — 콘솔(showInternal)</h2>
        <TicketTimeline replies={SAMPLE} showInternal />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">TicketTimeline — 빈 상태</h2>
        <TicketTimeline replies={[]} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">ReplyEditor — 5,001자 입력 시 제출 차단</h2>
        <ReplyEditor
          toolbarSlot={
            <Button type="button" variant="outline" size="sm">
              템플릿(자리만)
            </Button>
          }
          onSubmit={async (values) => {
            toast.success(`${values.isInternal ? '내부 메모' : '답변'} ${values.content.length}자`);
          }}
        />
      </section>
    </div>
  );
}
