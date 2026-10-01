// @owner PMJ
// 티켓 API (docs/04 §7). 컴포넌트에서 fetch 를 직접 부르지 않고 이 함수들만 쓴다 (docs/10 §2.3).
// 토큰 첨부·401 재발급·에러 변환은 client.ts(백성준)의 apiFetch 가 처리하므로 여기서 다루지 않는다.
// apiFetch 가 경로 앞에 /api 를 붙이므로 아래 경로에는 /api 를 적지 않는다.

import type {
  ClassificationUpdateRequest,
  ConsoleReplyCreateRequest,
  ConsoleTicketQuery,
  CustomerReplyCreateRequest,
  MyTicketQuery,
  TicketAssignRequest,
  TicketCreateRequest,
  TicketCreateResponse,
  TicketHistoryResponse,
  TicketPage,
  TicketReplyResponse,
  TicketResponse,
  TicketStatusChangeRequest,
} from '@/types/ticket';
import { apiFetch } from './client';

/**
 * 조회 조건을 쿼리스트링으로. 값이 없는 키는 보내지 않는다 —
 * `?status=`(빈 값)를 보내면 서버가 빈 문자열을 필터 값으로 받게 된다.
 */
function toQuery(params: object): string {
  const search = new URLSearchParams();
  // 조회 조건은 인터페이스(인덱스 시그니처 없음)로 들어오므로 엔트리에서 한 번 좁힌다
  for (const [key, value] of Object.entries(params) as [string, unknown][]) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
}

// ---- 고객용 (CU-03·CU-07·CU-08) ----

/** 문의 접수. 회원은 guest 를 생략한다. 비회원 접수는 요청 제한(10분 5건) 대상 (docs/04 §7) */
export function createTicket(req: TicketCreateRequest): Promise<TicketCreateResponse> {
  return apiFetch<TicketCreateResponse>('/tickets', { method: 'POST', body: req });
}

export function getMyTickets(query: MyTicketQuery = {}): Promise<TicketPage> {
  return apiFetch<TicketPage>(`/tickets/my${toQuery(query)}`);
}

/** 고객 본인 또는 Guest 토큰. 응답에 내부 메모는 포함되지 않는다 */
export function getTicket(ticketId: number): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/tickets/${ticketId}`);
}

/** 고객 추가 답글. RESOLVED 상태였다면 재문의로 IN_PROGRESS 가 된다 */
export function createCustomerReply(
  ticketId: number,
  req: CustomerReplyCreateRequest,
): Promise<TicketReplyResponse> {
  return apiFetch<TicketReplyResponse>(`/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: req,
  });
}

// ---- 콘솔 (CS-01·CS-02) ----

/** AGENT 는 본인 담당분만, LEAD+ 는 전체. 정렬 기본값은 서버의 SLA 임박순 */
export function getConsoleTickets(query: ConsoleTicketQuery = {}): Promise<TicketPage> {
  return apiFetch<TicketPage>(`/console/tickets${toQuery(query)}`);
}

export function getConsoleTicket(ticketId: number): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/console/tickets/${ticketId}`);
}

export function getTicketHistories(ticketId: number): Promise<TicketHistoryResponse[]> {
  return apiFetch<TicketHistoryResponse[]>(`/console/tickets/${ticketId}/histories`);
}

/** 불허 전이면 서버가 TICKET_INVALID_TRANSITION 을 돌려준다 — 프론트는 전이표를 갖지 않는다 */
export function updateTicketStatus(
  ticketId: number,
  req: TicketStatusChangeRequest,
): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/console/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: req,
  });
}

/** 수동 배정·재배정 (LEAD+) */
export function assignTicket(ticketId: number, req: TicketAssignRequest): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/console/tickets/${ticketId}/assign`, {
    method: 'PATCH',
    body: req,
  });
}

/** 자동 배정 재시도 (LEAD+). 가용 상담원이 없으면 ASSIGN_NO_AVAILABLE_AGENT */
export function autoAssignTicket(ticketId: number): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/console/tickets/${ticketId}/assign/auto`, { method: 'POST' });
}

/** 상담원 답변 또는 내부 메모. isInternal 로 구분한다 */
export function createConsoleReply(
  ticketId: number,
  req: ConsoleReplyCreateRequest,
): Promise<TicketReplyResponse> {
  return apiFetch<TicketReplyResponse>(`/console/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: req,
  });
}

/** 분류 수동 수정. 서버가 신수진 AiResultPort.markOverridden 도 함께 호출한다 (docs/02 §5.2) */
export function updateClassification(
  ticketId: number,
  req: ClassificationUpdateRequest,
): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/console/tickets/${ticketId}/classification`, {
    method: 'PATCH',
    body: req,
  });
}

// ---- TanStack Query 키 ----

/**
 * 쿼리 키 팩토리. 무효화 범위를 키 접두사로 조절한다.
 * - 전체: `invalidateQueries({ queryKey: ticketKeys.all })`
 * - 콘솔 목록 전부: `invalidateQueries({ queryKey: ['tickets', 'console', 'list'] })`
 *   (S2 에서 STOMP `/topic/console/tickets` 수신 시 이 접두사로 목록만 갱신한다)
 */
export const ticketKeys = {
  all: ['tickets'] as const,
  my: (query: MyTicketQuery = {}) => ['tickets', 'my', query] as const,
  detail: (ticketId: number) => ['tickets', 'detail', ticketId] as const,
  consoleList: (query: ConsoleTicketQuery = {}) => ['tickets', 'console', 'list', query] as const,
  consoleDetail: (ticketId: number) => ['tickets', 'console', 'detail', ticketId] as const,
  histories: (ticketId: number) => ['tickets', 'console', 'histories', ticketId] as const,
};
