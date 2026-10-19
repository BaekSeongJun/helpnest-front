// @owner BSJ
'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ClipboardList,
  HelpCircle,
  LogIn,
  type LucideIcon,
  MessageCircle,
  PenSquare,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/common/badges';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { faqKeys, getFaqs } from '@/lib/api/faq';
import { getMyTickets, ticketKeys } from '@/lib/api/ticket';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/types/ticket';
import { FaqAccordion } from './faq/faq-accordion';
import { Landing } from './landing';

interface Shortcut {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const MEMBER_SHORTCUTS: Shortcut[] = [
  { href: '/chat', icon: MessageCircle, title: '채팅 상담', description: '상담원과 실시간 대화' },
  { href: '/faq', icon: HelpCircle, title: '자주 묻는 질문', description: '궁금한 내용 먼저 찾기' },
];

const PUBLIC_SHORTCUTS: Shortcut[] = [
  {
    href: '/inquiry/new',
    icon: PenSquare,
    title: '문의하기',
    description: '회원가입 없이도 남길 수 있어요',
  },
  {
    href: '/inquiry/lookup',
    icon: ClipboardList,
    title: '비회원 문의 조회',
    description: '티켓번호로 진행 상황 확인',
  },
  {
    href: '/login?next=/chat',
    icon: LogIn,
    title: '로그인하고 채팅 상담',
    description: '회원은 상담원과 실시간 대화',
  },
];

/**
 * 고객 홈 (CU-01, front #74). 콘솔 페이지와 같은 구조: 제목 → 요약 → 목록.
 * 로그인 고객은 내 문의 현황, 그 외(비로그인)는 바로가기와 자주 묻는 질문을 본다
 */
export function Home() {
  const { status, member } = useAuth();

  // 비로그인: 소개 화면(전체 폭) + 바로가기·자주 묻는 질문. 셸이 이 화면에서는 사이드바와 폭 제한을 뺀다
  if (status === 'anonymous') {
    return (
      <Landing>
        <PublicHome anonymous />
      </Landing>
    );
  }

  return (
    <div>
      <PageHeader
        title="고객센터"
        description="궁금한 내용을 검색하거나 문의를 남겨 주세요."
        actions={
          <Button asChild>
            <Link href="/inquiry/new">
              <PenSquare className="size-4" />
              문의하기
            </Link>
          </Button>
        }
      />
      {/* 자바스크립트 없이도 동작하는 GET 폼 — /faq?keyword= */}
      <form role="search" action="/faq" className="mb-6 flex max-w-xl gap-2">
        <Input
          name="keyword"
          placeholder="자주 묻는 질문 검색 (예: 환불)"
          aria-label="FAQ 검색어"
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" />
          검색
        </Button>
      </form>

      {status === 'loading' ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : member?.role === 'CUSTOMER' ? (
        <MemberHome />
      ) : (
        <PublicHome anonymous={false} />
      )}
    </div>
  );
}

function Shortcuts({ items, className }: { items: Shortcut[]; className?: string }) {
  return (
    <nav
      aria-label="바로가기"
      className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {items.map(({ href, icon: Icon, title, description }) => (
        <Link
          key={href}
          href={href}
          className="bg-card hover:bg-accent focus-visible:ring-ring flex items-center gap-3 rounded-xl p-4 transition-colors outline-none focus-visible:ring-2"
        >
          <Icon className="text-primary size-5 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{title}</span>
            <span className="text-muted-foreground block truncate text-xs">{description}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold">{title}</h2>
      <Link href={href} className="text-muted-foreground hover:text-foreground text-sm">
        전체 보기
      </Link>
    </div>
  );
}

// 접수 직후 자동 배정되면 상태가 ASSIGNED 가 된다 — 고객에게는 둘 다 "아직 답변 전"이라 한 칸으로 묶는다
const SUMMARY: { label: string; statuses: TicketStatus[] }[] = [
  { label: '접수', statuses: ['RECEIVED', 'ASSIGNED'] },
  { label: '처리 중', statuses: ['IN_PROGRESS'] },
  { label: '해결', statuses: ['RESOLVED'] },
];
const COUNT_STATUSES = SUMMARY.flatMap((s) => s.statuses);
const RECENT = { size: 5 };

/** 로그인 고객: 상태별 건수(목록 API 의 totalElements — 전용 집계 API 없음) + 최근 문의 5건 */
function MemberHome() {
  const counts = useQueries({
    queries: COUNT_STATUSES.map((status) => ({
      queryKey: ticketKeys.my({ status, size: 1 }),
      queryFn: () => getMyTickets({ status, size: 1 }),
    })),
  });
  const countOf = (statuses: TicketStatus[]) =>
    statuses.reduce(
      (sum, s) => sum + (counts[COUNT_STATUSES.indexOf(s)].data?.totalElements ?? 0),
      0,
    );
  const countsPending = counts.some((q) => q.isPending);

  const recent = useQuery({ queryKey: ticketKeys.my(RECENT), queryFn: () => getMyTickets(RECENT) });

  return (
    <div className="space-y-8">
      <section aria-label="내 문의 현황" className="grid grid-cols-3 gap-3">
        {SUMMARY.map(({ label, statuses }) => (
          <Card key={label}>
            <CardContent className="space-y-1">
              <p className="text-muted-foreground text-sm">{label}</p>
              {countsPending ? (
                <Skeleton className="h-8 w-10" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">{countOf(statuses)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* 최근 문의: 표 대신 큼직한 목록 — 건수가 적어도 자리를 지키도록 최소 높이를 둔다 */}
        <section className="bg-card min-h-80 min-w-0 rounded-xl p-5 lg:col-span-2">
          <SectionTitle title="최근 문의" href="/my/inquiries" />
          {recent.isPending ? (
            <LoadingSkeleton variant="table" count={3} />
          ) : recent.isError ? (
            <ErrorState onRetry={() => recent.refetch()} />
          ) : !recent.data.content.length ? (
            <EmptyState
              icon={ClipboardList}
              title="아직 남긴 문의가 없습니다"
              description="궁금한 점을 남기면 진행 상황을 여기에서 확인할 수 있어요."
            />
          ) : (
            <ul className="divide-y">
              {recent.data.content.map((t) => (
                <li key={t.ticketId}>
                  <Link
                    href={`/my/inquiries/${t.ticketId}`}
                    className="hover:bg-muted focus-visible:ring-ring -mx-2 flex items-center gap-4 rounded-lg px-2 py-4 transition-colors outline-none focus-visible:ring-2"
                  >
                    <span
                      className="bg-accent text-accent-foreground flex size-11 shrink-0 items-center justify-center rounded-full"
                      aria-hidden
                    >
                      <ClipboardList className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium">{t.title}</span>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        <span className="font-mono">{t.ticketNo}</span> · {formatDate(t.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={t.status} />
                    <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Shortcuts items={MEMBER_SHORTCUTS} className="sm:grid-cols-2 lg:grid-cols-1" />
      </div>
    </div>
  );
}

const TOP_FAQS = { size: 5 };

/** 비로그인(과 직원 계정): 바로가기 + 자주 묻는 질문 5건(조회수 순). 로그인 카드는 비로그인에게만 */
function PublicHome({ anonymous }: { anonymous: boolean }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: faqKeys.list(TOP_FAQS),
    queryFn: () => getFaqs(TOP_FAQS),
  });

  return (
    <div className="space-y-8">
      <Shortcuts items={anonymous ? PUBLIC_SHORTCUTS : PUBLIC_SHORTCUTS.slice(0, 2)} />
      <section>
        <SectionTitle title="자주 묻는 질문" href="/faq" />
        {isPending ? (
          <LoadingSkeleton variant="table" count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data.content.length ? (
          <EmptyState title="등록된 질문이 없습니다" />
        ) : (
          <FaqAccordion faqs={data.content} />
        )}
      </section>
    </div>
  );
}
