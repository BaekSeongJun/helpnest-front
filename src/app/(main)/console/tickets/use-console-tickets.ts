// @owner PMJ
// URL 쿼리 ↔ 콘솔 티켓 목록 조회 (CS-01).
// 필터를 state 가 아니라 URL 에 두는 이유: 상세(CS-02)에 갔다가 뒤로 왔을 때 조건이 복원돼야 하고,
// 상담원끼리 "이 조건 좀 봐 달라"고 링크를 공유할 수 있어야 한다.
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORY_LABEL, PRIORITY_BADGE, SLA_BADGE, TICKET_STATUS_BADGE } from '@/config/badge';
import { getConsoleTickets, ticketKeys } from '@/lib/api/ticket';
import { useAuth } from '@/lib/auth/use-auth';
import type { ConsoleTicketQuery, TicketTab } from '@/types/ticket';

export const PAGE_SIZE = 20;

/** URL 에 싣는 키. 이 목록이 곧 공유 가능한 조건의 전부다 */
export type FilterKey = 'tab' | 'status' | 'priority' | 'category' | 'sla' | 'keyword' | 'page';
export type FilterPatch = Partial<Record<FilterKey, string | undefined>>;

const TABS: Record<TicketTab, true> = { MINE: true, UNASSIGNED: true, ALL: true };
/** 목록 필터로 쓰는 SLA 구간만. ON_TRACK 은 "여유"라 필터 값이 아니다 (docs/04 §7) */
const SLA_FILTER = { WARNING: SLA_BADGE.WARNING, BREACHED: SLA_BADGE.BREACHED };

/**
 * URL 은 사용자가 직접 고칠 수 있다. 모르는 값은 400 을 받는 대신 조건 없음으로 떨어뜨린다 —
 * 링크를 잘못 복사했을 때 에러 화면보다 전체 목록을 보여 주는 쪽이 낫다.
 */
function pick<T extends string>(value: string | null, allowed: Record<T, unknown>): T | undefined {
  return value && value in allowed ? (value as T) : undefined;
}

export function useConsoleTickets() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { member } = useAuth();

  // 전체 탭은 LEAD+ 만 (docs/09 §2.3 각주). AGENT 가 URL 로 ALL 을 넣어도 백엔드가 본인
  // 담당분만 주지만, 탭까지 MINE 으로 되돌려 화면과 결과가 어긋나지 않게 한다
  const canSeeAll = member?.role === 'LEAD' || member?.role === 'ADMIN';
  const requested = pick(params.get('tab'), TABS) ?? 'MINE';
  const tab: TicketTab = requested === 'ALL' && !canSeeAll ? 'MINE' : requested;

  const urlKeyword = params.get('keyword') ?? '';
  const [keyword, setKeyword] = useState(urlKeyword);
  const pushedKeyword = useRef(urlKeyword);

  const setFilters = useCallback(
    (patch: FilterPatch) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      // 조건이 바뀌면 1페이지로. page 를 직접 넘긴 경우만 그 값을 쓴다
      if (!('page' in patch)) next.delete('page');
      // push 가 아니라 replace — 타이핑·필터 조작마다 히스토리가 쌓이면 뒤로가기가 망가진다
      router.replace(`${pathname}?${next}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // 뒤로가기·초기화로 URL 이 밖에서 바뀌면 입력창을 맞춘다
  useEffect(() => {
    if (urlKeyword !== pushedKeyword.current) {
      pushedKeyword.current = urlKeyword;
      setKeyword(urlKeyword);
    }
  }, [urlKeyword]);

  // 타이핑은 300ms 모아서 한 번만 URL 로 보낸다 — 글자마다 요청이 나가지 않게
  useEffect(() => {
    if (keyword === pushedKeyword.current) return;
    const timer = setTimeout(() => {
      pushedKeyword.current = keyword;
      setFilters({ keyword: keyword || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, setFilters]);

  const query: ConsoleTicketQuery = {
    status: pick(params.get('status'), TICKET_STATUS_BADGE),
    priority: pick(params.get('priority'), PRIORITY_BADGE),
    category: pick(params.get('category'), CATEGORY_LABEL),
    sla: pick(params.get('sla'), SLA_FILTER),
    keyword: urlKeyword || undefined,
    page: Number(params.get('page')) || 0,
    size: PAGE_SIZE,
    // 탭은 그 자체가 필터다. 서버 파라미터로 번역하는 곳을 여기 한 곳으로 모은다
    ...(tab === 'MINE' ? { agentId: member?.memberId } : {}),
    ...(tab === 'UNASSIGNED' ? { unassigned: true } : {}),
  };

  const list = useQuery({
    queryKey: ticketKeys.consoleList(query),
    queryFn: () => getConsoleTickets(query),
    // 페이지·필터를 바꿀 때 표가 빈 상태로 깜빡이지 않게 이전 결과를 유지한다
    placeholderData: keepPreviousData,
  });

  const reset = useCallback(() => {
    setKeyword('');
    pushedKeyword.current = '';
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { tab, canSeeAll, params, query, keyword, setKeyword, setFilters, reset, list };
}
