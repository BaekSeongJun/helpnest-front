// @owner SSJ
// AI 분류 타입 — 백엔드 enum·DTO 와 같은 이름·값 (docs/03 §2.1, 04 §12)

export type TicketCategory =
  'DELIVERY' | 'REFUND' | 'EXCHANGE' | 'PAYMENT' | 'ACCOUNT' | 'SERVICE_ERROR' | 'ETC';

export type Urgency = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type Sentiment = 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE';

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

// ponytail: 08 §6 은 한글 라벨을 config/badge.ts 에만 두도록 한다 — 유형 라벨 추가 CR 머지되면 그쪽으로 교체
export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  DELIVERY: '배송',
  REFUND: '환불',
  EXCHANGE: '교환',
  PAYMENT: '결제',
  ACCOUNT: '계정',
  SERVICE_ERROR: '서비스 오류',
  ETC: '기타',
};
