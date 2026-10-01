// @owner BSJ
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown, Search } from 'lucide-react';
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
    <div className="mx-auto max-w-3xl">
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
        <ul className="bg-card divide-y rounded-lg border">
          {data.content.map((faq) => (
            <li key={faq.faqId}>
              <details
                className="group"
                onToggle={(e) => handleToggle(faq.faqId, e.currentTarget.open)}
              >
                <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="text-muted-foreground w-20 shrink-0 text-xs">
                    {CATEGORY_LABEL[faq.category]}
                  </span>
                  <span className="flex-1 font-medium">{faq.question}</span>
                  <ChevronDown
                    className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="bg-muted/30 px-4 py-3">
                  <PlainText text={faq.answer} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border p-6 text-center">
        <p className="font-medium">해결되지 않았나요?</p>
        <Button asChild>
          <Link href="/inquiry/new">문의하기</Link>
        </Button>
      </div>
    </div>
  );
}
