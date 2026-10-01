// @owner BSJ
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PlainText } from '@/components/common/plain-text';
import { CATEGORY_LABEL } from '@/config/badge';
import { faqKeys, suggestFaqs } from '@/lib/api/faq';

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 2; // 백엔드와 같은 기준 — 한 글자는 거의 모든 글에 걸린다

/**
 * 접수 폼 제목으로 FAQ 추천 (FR-INQ-05). 접수를 돕는 보조 영역이라
 * 로딩·결과 없음·오류일 때는 아무것도 그리지 않는다 (폼 흐름을 막지 않기 위해).
 */
export function FaqSuggest({ title }: { title: string }) {
  const q = useDebounced(title.trim(), DEBOUNCE_MS);
  const { data } = useQuery({
    queryKey: faqKeys.suggest(q),
    queryFn: () => suggestFaqs(q),
    enabled: q.length >= MIN_LENGTH,
    placeholderData: keepPreviousData, // 입력 중 목록이 깜빡이지 않게
    staleTime: 60 * 1000,
  });

  if (q.length < MIN_LENGTH || !data?.length) return null;

  return (
    <section aria-label="추천 FAQ" className="bg-muted/30 rounded-lg border p-3">
      <p className="mb-2 text-sm font-medium">이런 답변을 찾고 계신가요?</p>
      <ul className="bg-card divide-y rounded-md border">
        {data.map((faq) => (
          <li key={faq.faqId}>
            <details className="group">
              <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                <span className="text-muted-foreground w-16 shrink-0 text-xs">
                  {CATEGORY_LABEL[faq.category]}
                </span>
                <span className="flex-1">{faq.question}</span>
                <ChevronDown
                  className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="bg-muted/30 px-3 py-2">
                <PlainText text={faq.answer} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
