// @owner PMJ
// 티켓 도메인 타입 (docs/03 §3.2 DDL, 04 §7 API, 백엔드 domain/ticket/entity enum).
// enum 값 문자열은 백엔드와 **동일**해야 한다 (docs/10 §2.2).
// 라벨·색 매핑은 config/badge.ts(백성준)가 소유하고, 그 파일의 키가 아래 유니온과 1:1 로 맞는다.
// 날짜는 모두 ISO-8601(+09:00) 문자열로 받는다. Date 로 변환하지 않는다 — lib/format.ts 가 문자열을 처리한다.

import type { PageResponse } from './api';

// ---- enum (백엔드 domain/ticket/entity) ----

export type TicketStatus = 'RECEIVED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type TicketCategory =
  'DELIVERY' | 'REFUND' | 'EXCHANGE' | 'PAYMENT' | 'ACCOUNT' | 'SERVICE_ERROR' | 'ETC';

export type TicketPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

/** LLM 감정 판정. null 은 중립이 아니라 "아직 분류하지 않음"이다 (Ticket.sentiment 주석) */
export type Sentiment = 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE';

export type TicketChannel = 'WEB' | 'CHAT';

/** 답변 작성자 구분. GUEST·SYSTEM 은 writerId 가 없다 */
export type WriterType = 'CUSTOMER' | 'GUEST' | 'AGENT' | 'SYSTEM';

export type HistoryAction =
  'CREATE' | 'STATUS_CHANGE' | 'ASSIGN' | 'REASSIGN' | 'PRIORITY_CHANGE' | 'CATEGORY_CHANGE';

export type ActorType = 'MEMBER' | 'SYSTEM' | 'GUEST';

export type ActorRole = 'SYSTEM' | 'CUSTOMER' | 'AGENT' | 'LEAD' | 'ADMIN';

// ---- 화면 전용 코드 ----

/**
 * SLA 표시 구간. config/badge.ts 의 SLA_BADGE 키와 동일하다.
 * 목록 필터(`?sla=WARNING|BREACHED`)에는 WARNING·BREACHED 만 쓴다 (docs/04 §7).
 */
export type SlaState = 'ON_TRACK' | 'WARNING' | 'BREACHED';

/** CS-01 티켓함 탭. ALL 은 LEAD+ 만 (docs/09 §2.3 각주) */
export type TicketTab = 'MINE' | 'UNASSIGNED' | 'ALL';

// ---- 응답 ----

/** POST /api/attachments 응답 요소 (docs/04 §3, 백성준 소유 API) */
export interface TicketAttachment {
  attachmentId: number;
  originalName: string;
  size: number;
}

/**
 * 목록 한 행. CS-01 표 10열(docs/09 §2.3)과 공용 SlaBadge props 를 모두 채운다.
 * SLA 관련 4개 필드를 함께 받는 이유: 임박 판정 기준인 warningRatio 가 SLA_POLICY 에 있어
 * 프론트가 계산할 수 없으므로 백엔드가 slaWarned 로 내려준다 (components/common/badges.tsx 주석).
 */
export interface TicketListItem {
  ticketId: number;
  ticketNo: string;
  title: string;
  /** 회원이면 member_id, 비회원이면 null */
  customerId: number | null;
  /** 회원은 이름, 비회원은 guest_name */
  customerName: string;
  category: TicketCategory;
  priority: TicketPriority;
  /** 분류 전이면 null */
  sentiment: Sentiment | null;
  status: TicketStatus;
  /** 배정 전이면 null */
  agentId: number | null;
  agentName: string | null;
  firstResponseDueAt: string;
  /** 상담원 첫 답변 시각. null 이면 SLA 감시 대상 */
  firstRespondedAt: string | null;
  slaWarned: boolean;
  slaBreached: boolean;
  createdAt: string;
}

/**
 * 상세. GET /api/tickets/{id}(고객)과 GET /api/console/tickets/{id}(콘솔)이 같은 형태를 쓰고,
 * **고객 응답에는 내부 메모(isInternal: true)가 포함되지 않는다** — 서버 조회 쿼리에서 걸러진다
 * (TicketReply 의 "고객 노출 여부" 주석). 화면단 필터링에 의존하지 않는다.
 */
export interface TicketResponse extends TicketListItem {
  content: string;
  channel: TicketChannel;
  attachments: TicketAttachment[];
  replies: TicketReplyResponse[];
  assignedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
}

/** 답변·내부 메모 한 건. TicketTimeline 이 이 타입을 그대로 받는다 */
export interface TicketReplyResponse {
  replyId: number;
  writerType: WriterType;
  /** GUEST 는 비회원 이름, SYSTEM 은 '시스템' */
  writerName: string;
  content: string;
  isInternal: boolean;
  attachments: TicketAttachment[];
  createdAt: string;
}

/**
 * 상태·배정·우선순위·유형 변경 이력 한 건.
 * fromValue·toValue 는 action 에 따라 의미가 달라지는 문자열이다
 * (STATUS_CHANGE 면 TicketStatus 이름, ASSIGN 이면 member_id 문자열 — HistoryAction 주석).
 */
export interface TicketHistoryResponse {
  historyId: number;
  action: HistoryAction;
  fromValue: string | null;
  toValue: string | null;
  /** ASSIGN·REASSIGN 일 때 fromValue·toValue(member_id)의 상담원 이름. 그 외·조회 불가면 null */
  fromName: string | null;
  toName: string | null;
  /** actorType 이 MEMBER 가 아니면 null */
  actorName: string | null;
  actorType: ActorType;
  memo: string | null;
  createdAt: string;
}

export type TicketPage = PageResponse<TicketListItem>;

// ---- 요청 ----

/** 비회원 접수 정보. password 는 조회용 비밀번호이며 서버가 BCrypt 해시로만 저장한다 */
export interface TicketGuestInfo {
  name: string;
  email: string;
  password: string;
}

/**
 * POST /api/tickets (docs/04 §7). 회원이면 guest 를 생략한다.
 * 백성준 CU-03(문의 접수 폼)이 이 타입을 사용한다.
 */
export interface TicketCreateRequest {
  title: string;
  content: string;
  /** 고객이 고른 유형. 최종 유형은 AI 분류가 정한다 (docs/05) */
  categoryHint?: TicketCategory;
  attachmentIds?: number[];
  guest?: TicketGuestInfo;
}

export interface TicketCreateResponse {
  ticketId: number;
  ticketNo: string;
  status: TicketStatus;
}

/** PATCH /api/console/tickets/{id}/status. 전이 가능 여부는 서버가 판정한다 */
export interface TicketStatusChangeRequest {
  toStatus: TicketStatus;
  memo?: string;
}

/** PATCH /api/console/tickets/{id}/assign (LEAD+) */
export interface TicketAssignRequest {
  agentId: number;
  memo?: string;
}

/** POST /api/console/tickets/{id}/replies. content 는 일반 텍스트 5,000자 이하 */
export interface ConsoleReplyCreateRequest {
  content: string;
  /** true 면 내부 메모 — 고객에게 보이지 않고 SLA·상태에 영향을 주지 않는다 */
  isInternal: boolean;
  aiDraftId?: number;
  attachmentIds?: number[];
}

/** POST /api/tickets/{id}/replies. RESOLVED 상태면 재문의로 IN_PROGRESS 전이된다 */
export interface CustomerReplyCreateRequest {
  content: string;
  attachmentIds?: number[];
}

/** PATCH /api/console/tickets/{id}/classification. 상담원 수동 수정 */
export interface ClassificationUpdateRequest {
  category: TicketCategory;
  priority: TicketPriority;
}

// ---- 조회 조건 ----

/** GET /api/tickets/my */
export interface MyTicketQuery {
  status?: TicketStatus;
  page?: number;
  size?: number;
}

/**
 * GET /api/console/tickets (docs/04 §7).
 * unassigned 와 agentId 는 상호 배타다 — 미배정 탭은 unassigned: true 를 쓴다.
 * AGENT 는 agentId 를 무엇으로 보내도 서버가 본인 담당분만 돌려준다.
 */
export interface ConsoleTicketQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  agentId?: number;
  unassigned?: boolean;
  sla?: Extract<SlaState, 'WARNING' | 'BREACHED'>;
  keyword?: string;
  page?: number;
  size?: number;
  /** 예: 'createdAt,desc'. 생략하면 서버가 SLA 임박순으로 정렬한다 */
  sort?: string;
}

/**
 * 콘솔 목록 갱신 신호 (`/topic/console/tickets`, docs/04 §11). 목록 한 줄이 아니다 —
 * 받으면 현재 조건으로 목록·상세를 다시 읽는다(필터·권한은 API 가 처리).
 */
export interface ConsoleTicketEvent {
  ticketId: number;
  event: 'CREATED' | 'UPDATED';
  status: TicketStatus;
  priority: TicketPriority;
  agentId: number | null;
}
