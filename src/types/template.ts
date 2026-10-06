// @owner BSJ
// 답변 템플릿 타입 (백엔드 domain/template/dto, docs/04 §4)
import type { TicketCategory } from './ticket';

export interface Template {
  templateId: number;
  category: TicketCategory;
  title: string;
  /** {고객명}·{티켓번호} 치환 변수 포함 원문 */
  content: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 작성·수정. active 를 생략하면 사용 */
export interface TemplateRequest {
  category: TicketCategory;
  title: string;
  content: string;
  active?: boolean;
}

export interface TemplateQuery {
  category?: TicketCategory;
  keyword?: string;
  page?: number;
  size?: number;
}
