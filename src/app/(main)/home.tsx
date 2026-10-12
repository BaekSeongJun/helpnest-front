// @owner BSJ
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  type LucideIcon,
  MessageSquarePlus,
  MessagesSquare,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { faqKeys, getFaqs } from '@/lib/api/faq';
import { FaqAccordion } from './faq/faq-accordion';

const TOP_FAQS = { size: 5 };

const SHORTCUTS: { href: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    href: '/inquiry/new',
    icon: MessageSquarePlus,
    title: '문의하기',
    description: '회원가입 없이도 남길 수 있어요',
  },
  {
    href: '/chat',
    icon: MessagesSquare,
    title: '채팅 상담',
    description: '회원 전용 · 상담원과 실시간 대화',
  },
  {
    href: '/inquiry/lookup',
    icon: ClipboardList,
    title: '문의 조회',
    description: '티켓번호로 진행 상황 확인',
  },
];

/** 고객 홈 (CU-01). FAQ 검색 → /faq, 자주 묻는 질문 5개(조회수 순), 바로가기 카드 */
export function Home() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: faqKeys.list(TOP_FAQS),
    queryFn: () => getFaqs(TOP_FAQS),
  });

  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-4 text-center">
        <h1 className="text-2xl font-semibold">무엇을 도와드릴까요?</h1>
        <p className="text-muted-foreground text-sm">
          궁금한 내용을 검색하거나 문의를 남겨 주세요.
        </p>
        {/* 자바스크립트 없이도 동작하는 GET 폼 — /faq?keyword= */}
        <form role="search" action="/faq" className="mx-auto flex max-w-xl gap-2">
          <Input
            name="keyword"
            placeholder="검색어를 입력하세요 (예: 환불)"
            aria-label="FAQ 검색어"
          />
          <Button type="submit">
            <Search className="size-4" />
            검색
          </Button>
        </form>
      </section>

      <nav aria-label="바로가기" className="grid gap-3 sm:grid-cols-3">
        {SHORTCUTS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="bg-card hover:bg-accent focus-visible:ring-ring flex flex-col gap-2 rounded-lg border p-5 shadow-xs transition-colors outline-none focus-visible:ring-2"
          >
            <Icon className="text-primary size-6" aria-hidden />
            <span className="font-medium">{title}</span>
            <span className="text-muted-foreground text-sm">{description}</span>
          </Link>
        ))}
      </nav>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">자주 묻는 질문</h2>
          <Link href="/faq" className="text-muted-foreground hover:text-foreground text-sm">
            전체 보기
          </Link>
        </div>
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
