// @owner BSJ
// 고객 이력 묶음 API (docs/04 §6, CS-02 패널·CS-07)
import type { PageResponse } from '@/types/api';
import { apiFetch } from './client';

export interface CustomerHistoryItem {
  ticketId: number;
  ticketNo: string;
  title: string;
  /** TicketStatus. 모르는 값은 StatusBadge 가 원문으로 그린다 */
  status: string;
  category: string;
  createdAt: string;
  /** 설문 미응답이면 null */
  rating: number | null;
}

export interface CustomerHistory {
  /** M-{memberId} 또는 G-{email}. 전체 보기 링크에 그대로 쓴다 */
  customerKey: string;
  customerName: string | null;
  summary: {
    /** 지금 보는 티켓까지 포함한 전체 건수 */
    totalCount: number;
    /** 소수 1자리. 응답이 없으면 null */
    avgRating: number | null;
    /** 티켓이 없으면 null */
    lastTicketAt: string | null;
  };
  /** by-ticket 은 지금 보는 티켓이 빠진다 */
  tickets: PageResponse<CustomerHistoryItem>;
}

/** CS-02 패널용: 이 티켓 고객의 과거 문의. 비회원 이메일이 URL 에 들어가므로 키는 항상 인코딩한다 */
export function getCustomerHistoryByTicket(ticketId: number, size = 5): Promise<CustomerHistory> {
  return apiFetch<CustomerHistory>(`/console/customers/by-ticket/${ticketId}?size=${size}`);
}

export function getCustomerHistory(
  customerKey: string,
  page = 0,
  size = 20,
): Promise<CustomerHistory> {
  return apiFetch<CustomerHistory>(
    `/console/customers/${encodeURIComponent(customerKey)}/tickets?page=${page}&size=${size}`,
  );
}

export const customerHistoryKeys = {
  byTicket: (ticketId: number) => ['console', 'customers', 'by-ticket', ticketId] as const,
  byKey: (customerKey: string, page: number) =>
    ['console', 'customers', 'by-key', customerKey, page] as const,
};

/** 전체 보기(CS-07) 경로 */
export function customerHistoryHref(customerKey: string): string {
  return `/console/customers/${encodeURIComponent(customerKey)}`;
}
