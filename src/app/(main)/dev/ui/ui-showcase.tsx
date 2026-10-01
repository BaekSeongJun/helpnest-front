// @owner BSJ
'use client';

import { Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import {
  AiBadge,
  PriorityBadge,
  SentimentBadge,
  SlaBadge,
  StatusBadge,
} from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { FilterBar } from '@/components/common/filter-bar';
import { PageHeader } from '@/components/common/page-header';
import { PlainText } from '@/components/common/plain-text';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TemplatePicker } from '@/components/template/template-picker';
import { PRIORITY_BADGE, TICKET_STATUS_BADGE } from '@/config/badge';
import { formatDateTime } from '@/lib/format';

interface SampleTicket {
  id: number;
  ticketNo: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

const STATUSES = Object.keys(TICKET_STATUS_BADGE);
const PRIORITIES = Object.keys(PRIORITY_BADGE);
const SAMPLE: SampleTicket[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  ticketNo: `HN-20261002-${String(i + 1).padStart(6, '0')}`,
  title: `샘플 문의 ${i + 1}`,
  status: STATUSES[i % STATUSES.length],
  priority: PRIORITIES[i % PRIORITIES.length],
  createdAt: new Date(2026, 9, 2, 9, i).toISOString(),
}));
const PAGE_SIZE = 10;

const COLUMNS: DataTableColumn<SampleTicket>[] = [
  { header: '번호', cell: (t) => t.ticketNo, className: 'w-48 tabular-nums' },
  { header: '제목', cell: (t) => t.title },
  { header: '상태', cell: (t) => <StatusBadge status={t.status} />, className: 'w-24' },
  { header: '우선순위', cell: (t) => <PriorityBadge priority={t.priority} />, className: 'w-24' },
  { header: '접수일', cell: (t) => formatDateTime(t.createdAt), className: 'w-40' },
];

const XSS_SAMPLE = `<script>alert('xss')</script> <b>굵게 아님</b>
두 번째 줄입니다. 링크: https://helpnest.kro.kr/faq?q=배송.
괄호 안 링크(https://example.com/a_b) 도 문장부호는 빠집니다.
javascript:alert(1) 는 링크가 되지 않습니다.`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function UiShowcase() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [tableState, setTableState] = useState<'data' | 'loading' | 'empty'>('data');
  const [reply, setReply] = useState('');

  const filtered = SAMPLE.filter((t) => t.title.includes(keyword));
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  // 샘플 기준 시각은 첫 렌더에 한 번만 고정
  const [now] = useState(() => Date.now());

  return (
    <div className="space-y-10">
      <PageHeader
        title="공용 컴포넌트"
        description="components/common 샘플 (개발 환경에서만 보임)"
        actions={
          <Button>
            <Plus className="size-4" />
            액션 버튼
          </Button>
        }
      />

      <Section title="배지">
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
          {PRIORITIES.map((p) => (
            <PriorityBadge key={p} priority={p} />
          ))}
          <SentimentBadge sentiment="NEGATIVE" />
          <SentimentBadge sentiment="NEUTRAL" />
          <AiBadge />
          <StatusBadge status="UNKNOWN_VALUE" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlaBadge dueAt={new Date(now + 135 * 60_000).toISOString()} />
          <SlaBadge dueAt={new Date(now + 20 * 60_000).toISOString()} warning />
          <SlaBadge dueAt={new Date(now - 5 * 60_000).toISOString()} />
          <SlaBadge dueAt={new Date(now).toISOString()} respondedAt={new Date(now).toISOString()} />
          <span className="text-muted-foreground text-xs">
            ← 여유 / 임박 / 초과 / 응답 완료(없음)
          </span>
        </div>
      </Section>

      <Section title="DataTable + FilterBar">
        <FilterBar
          onReset={() => {
            setKeyword('');
            setPage(0);
          }}
        >
          <Input
            placeholder="제목 검색"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            className="w-56"
          />
          {(['data', 'loading', 'empty'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={tableState === s ? 'secondary' : 'ghost'}
              onClick={() => setTableState(s)}
            >
              {s}
            </Button>
          ))}
        </FilterBar>
        <DataTable
          columns={COLUMNS}
          data={tableState === 'empty' ? [] : pageData}
          rowKey={(t) => t.id}
          loading={tableState === 'loading'}
          emptyText="문의가 없습니다"
          emptyAction={<Button size="sm">문의하기</Button>}
          pagination={{
            page,
            totalPages: Math.ceil(filtered.length / PAGE_SIZE),
            onPageChange: setPage,
          }}
          onRowClick={(t) => toast(`${t.ticketNo} 클릭`)}
        />
      </Section>

      <Section title="상태 패턴">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-card rounded-lg border">
            <EmptyState
              title="문의가 없습니다"
              description="첫 문의를 남겨 보세요."
              action={<Button size="sm">문의하기</Button>}
            />
          </div>
          <div className="bg-card rounded-lg border">
            <ErrorState onRetry={() => toast('다시 시도')} />
          </div>
        </div>
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="detail" />
      </Section>

      <Section title="ConfirmDialog">
        <div className="flex flex-wrap gap-2">
          <ConfirmDialog
            trigger={<Button variant="outline">해결 처리</Button>}
            title="티켓을 해결 처리할까요?"
            description="고객에게 결과 메일과 만족도 설문이 발송됩니다."
            confirmText="해결 처리"
            onConfirm={() =>
              new Promise<void>((r) => setTimeout(r, 800)).then(() => {
                toast.success('해결 처리했습니다');
              })
            }
          />
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 className="size-4" />
                삭제
              </Button>
            }
            title="FAQ를 삭제할까요?"
            description="삭제하면 되돌릴 수 없습니다."
            confirmText="삭제"
            destructive
            onConfirm={() =>
              new Promise<void>((_, reject) => setTimeout(reject, 800)).catch((e) => {
                toast.error('삭제에 실패했습니다');
                throw e;
              })
            }
          />
        </div>
      </Section>

      <Section title="PlainText (이스케이프 + 줄바꿈 + 링크)">
        <div className="bg-card rounded-lg border p-4">
          <PlainText text={XSS_SAMPLE} />
        </div>
      </Section>

      <Section title="TemplatePicker (AGENT+ 로그인 필요, 박민재 ReplyEditor 에서 사용)">
        <div className="bg-card space-y-2 rounded-lg border p-4">
          <TemplatePicker
            category="REFUND"
            customerName="홍길동"
            ticketNo="HN-20261002-000123"
            onSelect={(text) =>
              setReply((prev) =>
                prev
                  ? `${prev}
${text}`
                  : text,
              )
            }
          />
          <Textarea
            rows={6}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            aria-label="답변 미리보기"
          />
        </div>
      </Section>
    </div>
  );
}
