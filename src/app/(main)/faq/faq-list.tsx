// @owner BSJ
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Minus, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { PlainText } from '@/components/common/plain-text';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_LABEL } from '@/config/badge';
import { faqKeys, getFaq, getFaqs } from '@/lib/api/faq';
import type { TicketCategory } from '@/types/ticket';

const ALL = 'ALL';
// ponytail: 유형별 몇 개 수준이라 한 번에 받는다. 수백 건이 되면 페이지 버튼 추가
const PAGE_SIZE = 100;

/** 고객 FAQ (CU-02). 유형 탭 + 키워드 검색 + 아코디언(열 때 조회수 +1) */
export function FaqList() {
  const [category, setCategory] = useState<TicketCategory | typeof ALL>(ALL);
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  // 같은 화면에서 여러 번 열고 닫아도 조회수는 한 번만
  const counted = useRef(new Set<number>());

  const query = { category: category === ALL ? undefined : category, keyword, size: PAGE_SIZE };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: faqKeys.list(query),
    queryFn: () => getFaqs(query),
    placeholderData: keepPreviousData,
  });

  function handleToggle(faqId: number, open: boolean) {
    if (!open || counted.current.has(faqId)) return;
    counted.current.add(faqId);
    getFaq(faqId).catch(() => {}); // 조회수는 실패해도 화면에 영향 없음
  }

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
        <TabsList className="mb-4 h-auto flex-wrap">
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
        // 시안 A안: 질문마다 카드, 오른쪽 둥근 +/− 버튼
        <ul className="space-y-2">
          {data.content.map((faq) => (
            <li key={faq.faqId} className="bg-card rounded-lg border shadow-xs">
              <details
                className="group"
                onToggle={(e) => handleToggle(faq.faqId, e.currentTarget.open)}
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-1 pr-1 pl-5 [&::-webkit-details-marker]:hidden">
                  <span className="text-muted-foreground w-20 shrink-0 text-xs font-semibold">
                    {CATEGORY_LABEL[faq.category]}
                  </span>
                  <span className="flex-1 text-sm font-medium">{faq.question}</span>
                  <span
                    className="bg-muted text-foreground group-open:bg-foreground group-open:text-background flex size-10 shrink-0 items-center justify-center rounded-full"
                    aria-hidden
                  >
                    <Plus className="size-4 group-open:hidden" />
                    <Minus className="hidden size-4 group-open:block" />
                  </span>
                </summary>
                <div className="text-secondary-foreground px-5 pt-1 pb-4 text-sm leading-relaxed sm:pl-[6.75rem]">
                  <PlainText text={faq.answer} />
                </div>
              </details>
            </li>
          ))}
        </ul>
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
