// @owner BSJ
// FAQ 타입 (백엔드 domain/faq/dto, docs/04 §4)
import type { TicketCategory } from './ticket';

export interface Faq {
  faqId: number;
  category: TicketCategory;
  question: string;
  answer: string;
  published: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 작성·수정. published 를 생략하면 공개 */
export interface FaqRequest {
  category: TicketCategory;
  question: string;
  answer: string;
  published?: boolean;
}

export interface FaqQuery {
  category?: TicketCategory;
  keyword?: string;
  page?: number;
  size?: number;
}
