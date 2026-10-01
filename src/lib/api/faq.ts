// @owner BSJ
// FAQ API (docs/04 §4). apiFetch 가 /api 를 붙인다
import type { PageResponse } from '@/types/api';
import type { Faq, FaqQuery, FaqRequest } from '@/types/faq';
import { apiFetch } from './client';

function toQuery({ category, keyword, page, size }: FaqQuery): string {
  const search = new URLSearchParams();
  if (category) search.set('category', category);
  if (keyword?.trim()) search.set('keyword', keyword.trim());
  if (page) search.set('page', String(page));
  if (size) search.set('size', String(size));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// ---- 공개 (CU-02) ----

/** 공개 글만, 조회수 순 */
export function getFaqs(query: FaqQuery = {}): Promise<PageResponse<Faq>> {
  return apiFetch<PageResponse<Faq>>(`/faqs${toQuery(query)}`);
}

/** 접수 폼 추천 (FR-INQ-05). 공개 글 조회수 상위 3건, q 가 2자 미만이면 빈 배열 */
export function suggestFaqs(q: string): Promise<Faq[]> {
  return apiFetch<Faq[]>(`/faqs/suggest?${new URLSearchParams({ q })}`);
}

/** 조회수 +1. 아코디언을 열 때 부른다 */
export function getFaq(faqId: number): Promise<Faq> {
  return apiFetch<Faq>(`/faqs/${faqId}`);
}

// ---- 관리 (AD-02, LEAD+) ----

/** 비공개 포함, 최신순 */
export function getAdminFaqs(query: FaqQuery = {}): Promise<PageResponse<Faq>> {
  return apiFetch<PageResponse<Faq>>(`/admin/faqs${toQuery(query)}`);
}

export function createFaq(req: FaqRequest): Promise<Faq> {
  return apiFetch<Faq>('/admin/faqs', { method: 'POST', body: req });
}

export function updateFaq(faqId: number, req: FaqRequest): Promise<Faq> {
  return apiFetch<Faq>(`/admin/faqs/${faqId}`, { method: 'PUT', body: req });
}

export function deleteFaq(faqId: number): Promise<void> {
  return apiFetch<void>(`/admin/faqs/${faqId}`, { method: 'DELETE' });
}

/** 저장 후 invalidateQueries({ queryKey: faqKeys.all }) 로 고객·관리 목록을 함께 갱신 */
export const faqKeys = {
  all: ['faqs'] as const,
  list: (query: FaqQuery) => ['faqs', 'list', query] as const,
  admin: (query: FaqQuery) => ['faqs', 'admin', query] as const,
  suggest: (q: string) => ['faqs', 'suggest', q] as const,
};
