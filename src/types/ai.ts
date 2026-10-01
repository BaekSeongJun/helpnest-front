// @owner SSJ
// AI 분류 타입 — 백엔드 DTO 와 같은 이름·값 (04 §12). 값 집합은 types/ticket.ts(박민재) 재사용

import type { Sentiment, TicketCategory, TicketPriority } from './ticket';

/** LLM 판정 긴급도. 값 집합은 priority 와 같고, 감정 보정 전 원본이다 (docs/05 §3.1 5번) */
export type Urgency = TicketPriority;

/** GET /api/console/tickets/{id}/ai. FAILED 면 분류값이 null. 결과 자체가 없으면(분류 중) 응답 data 가 null */
export interface AiResult {
  category: TicketCategory | null;
  urgency: Urgency | null;
  sentiment: Sentiment | null;
  summary: string | null;
  /** 0 ~ 1 */
  confidence: number | null;
  status: 'SUCCESS' | 'FAILED';
}

/** AI-2 초안 참고 자료. label: FAQ 질문 / 과거 답변 앞 40자 */
export interface DraftReference {
  type: 'FAQ' | 'REPLY';
  id: number;
  label: string;
}

/** POST /api/console/tickets/{id}/ai/drafts */
export interface AiDraft {
  draftId: number;
  content: string;
  references: DraftReference[];
  model: string | null;
  createdAt: string;
}
