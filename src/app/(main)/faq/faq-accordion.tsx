// @owner BSJ
'use client';

import { Minus, Plus } from 'lucide-react';
import { useRef } from 'react';
import { PlainText } from '@/components/common/plain-text';
import { CATEGORY_LABEL } from '@/config/badge';
import { getFaq } from '@/lib/api/faq';
import type { Faq } from '@/types/faq';

/** FAQ 아코디언 (CU-01·CU-02 공용). 열 때 조회수 +1 — 시안 A안: 질문마다 카드, 오른쪽 둥근 +/− 버튼 */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  // 같은 화면에서 여러 번 열고 닫아도 조회수는 한 번만
  const counted = useRef(new Set<number>());

  function handleToggle(faqId: number, open: boolean) {
    if (!open || counted.current.has(faqId)) return;
    counted.current.add(faqId);
    getFaq(faqId).catch(() => {}); // 조회수는 실패해도 화면에 영향 없음
  }

  return (
    <ul className="space-y-2">
      {faqs.map((faq) => (
        <li key={faq.faqId} className="bg-card rounded-xl">
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
  );
}
