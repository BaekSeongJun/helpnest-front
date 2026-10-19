// @owner BSJ
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_LABEL } from '@/config/badge';
import { faqKeys, getFaqs } from '@/lib/api/faq';
import type { TicketCategory } from '@/types/ticket';
import { FaqAccordion } from './faq-accordion';

const ALL = 'ALL';
// ponytail: 유형별 몇 개 수준이라 한 번에 받는다. 수백 건이 되면 페이지 버튼 추가
const PAGE_SIZE = 100;

/** 고객 FAQ (CU-02). 유형 탭 + 키워드 검색 + 아코디언. initialKeyword 는 홈 검색창에서 넘어온 값 */
export function FaqList({ initialKeyword = '' }: { initialKeyword?: string }) {
  const [category, setCategory] = useState<TicketCategory | typeof ALL>(ALL);
  const [input, setInput] = useState(initialKeyword);
  const [keyword, setKeyword] = useState(initialKeyword.trim());

  const query = { category: category === ALL ? undefined : category, keyword, size: PAGE_SIZE };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: faqKeys.list(query),
    queryFn: () => getFaqs(query),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader title="자주 묻는 질문" description="궁금한 내용을 먼저 찾아보세요." />

      <form
        role="search"
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(input.trim());
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="검색어를 입력하세요 (예: 환불)"
          aria-label="FAQ 검색어"
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" />
          검색
        </Button>
      </form>

      <Tabs value={category} onValueChange={(v) => setCategory(v as TicketCategory | typeof ALL)}>
        {/* 좁은 화면에서는 줄바꿈 대신 가로 스크롤 — 알약 배경 밖으로 넘치지 않게 */}
        <TabsList className="mb-4 max-w-full [scrollbar-width:none] justify-start overflow-x-auto">
          <TabsTrigger value={ALL}>전체</TabsTrigger>
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending ? (
        <LoadingSkeleton variant="table" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data.content.length ? (
        <EmptyState
          title="검색 결과가 없습니다"
          description="다른 검색어로 찾아보거나 문의를 남겨 주세요."
        />
      ) : (
        <FaqAccordion faqs={data.content} />
      )}

      <div className="bg-accent mt-8 flex flex-col gap-3 rounded-lg px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-accent-foreground font-semibold">원하는 답을 찾지 못하셨나요?</p>
          <p className="text-secondary-foreground text-sm">상담원이 직접 도와드릴게요.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/inquiry/new">문의하기</Link>
        </Button>
      </div>
    </div>
  );
}
