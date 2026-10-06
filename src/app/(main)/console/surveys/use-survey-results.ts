// @owner BSJ
// URL 쿼리 ↔ 설문 결과 조회 (CS-06). 필터를 URL 에 두는 이유는 티켓 상세(CS-02)에 갔다가 뒤로 왔을 때
// 조건이 복원되고, 조건을 링크로 공유할 수 있어야 하기 때문이다 (콘솔 티켓함과 같은 방식)
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { CATEGORY_LABEL } from '@/config/badge';
import { getConsoleAgents, consoleAgentKeys } from '@/lib/api/console-agent';
import {
  getSurveyResults,
  getSurveySummary,
  type SurveyResultQuery,
  type SurveySummaryQuery,
  surveyResultKeys,
} from '@/lib/api/console-survey';
import { useAuth } from '@/lib/auth/use-auth';
import type { TicketCategory } from '@/types/ticket';

export const PAGE_SIZE = 20;

export type FilterKey = 'from' | 'to' | 'rating' | 'agentId' | 'category' | 'page';
export type FilterPatch = Partial<Record<FilterKey, string | undefined>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * URL 은 사용자가 직접 고칠 수 있다. 모르는 값은 400 을 받는 대신 조건 없음으로 떨어뜨린다 —
 * 링크를 잘못 복사했을 때 에러 화면보다 전체 결과를 보여 주는 쪽이 낫다.
 */
function pickDate(value: string | null): string | undefined {
  return value && DATE.test(value) ? value : undefined;
}

function pickRating(value: string | null): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

function pickCategory(value: string | null): TicketCategory | undefined {
  return value && value in CATEGORY_LABEL ? (value as TicketCategory) : undefined;
}

export function useSurveyResults() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { member } = useAuth();

  // 상담원 필터는 LEAD+ 만. AGENT 는 URL 에 agentId 를 넣어도 서버가 본인 담당분으로 고정하지만,
  // 화면과 결과가 어긋나지 않게 쿼리에서도 뺀다
  const canSeeAll = member?.role === 'LEAD' || member?.role === 'ADMIN';
  const agentId =
    canSeeAll && Number(params.get('agentId')) > 0 ? Number(params.get('agentId')) : undefined;

  const summaryQuery: SurveySummaryQuery = {
    from: pickDate(params.get('from')),
    to: pickDate(params.get('to')),
    agentId,
    category: pickCategory(params.get('category')),
  };
  const listQuery: SurveyResultQuery = {
    ...summaryQuery,
    rating: pickRating(params.get('rating')),
    page: Number(params.get('page')) || 0,
    size: PAGE_SIZE,
  };

  const setFilters = useCallback(
    (patch: FilterPatch) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      // 조건이 바뀌면 1페이지로. page 를 직접 넘긴 경우만 그 값을 쓴다
      if (!('page' in patch)) next.delete('page');
      // push 가 아니라 replace — 필터를 만질 때마다 히스토리가 쌓이면 뒤로가기가 망가진다
      router.replace(`${pathname}?${next}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  const summary = useQuery({
    queryKey: surveyResultKeys.summary(summaryQuery),
    queryFn: () => getSurveySummary(summaryQuery),
    placeholderData: keepPreviousData,
  });
  const list = useQuery({
    queryKey: surveyResultKeys.list(listQuery),
    queryFn: () => getSurveyResults(listQuery),
    // 페이지·필터를 바꿀 때 표가 빈 상태로 깜빡이지 않게 이전 결과를 유지한다
    placeholderData: keepPreviousData,
  });
  const agents = useQuery({
    queryKey: consoleAgentKeys.all,
    queryFn: getConsoleAgents,
    enabled: canSeeAll,
  });

  return { params, canSeeAll, agents: agents.data ?? [], setFilters, reset, summary, list };
}
