// @owner BSJ
// 답변 템플릿 API (docs/04 §4). apiFetch 가 /api 를 붙인다
import type { PageResponse } from '@/types/api';
import type { Template, TemplateQuery, TemplateRequest } from '@/types/template';
import { apiFetch } from './client';

function toQuery({ category, keyword, page, size }: TemplateQuery): string {
  const search = new URLSearchParams();
  if (category) search.set('category', category);
  if (keyword?.trim()) search.set('keyword', keyword.trim());
  if (page) search.set('page', String(page));
  if (size) search.set('size', String(size));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** 상담원용 (AGENT+). 사용 중인 템플릿만, 제목순 */
export function getTemplates(query: TemplateQuery = {}): Promise<PageResponse<Template>> {
  return apiFetch<PageResponse<Template>>(`/templates${toQuery(query)}`);
}

// ---- 관리 (AD-03, LEAD+) ----

/** 미사용 포함, 최신순 */
export function getAdminTemplates(query: TemplateQuery = {}): Promise<PageResponse<Template>> {
  return apiFetch<PageResponse<Template>>(`/admin/templates${toQuery(query)}`);
}

export function createTemplate(req: TemplateRequest): Promise<Template> {
  return apiFetch<Template>('/admin/templates', { method: 'POST', body: req });
}

export function updateTemplate(templateId: number, req: TemplateRequest): Promise<Template> {
  return apiFetch<Template>(`/admin/templates/${templateId}`, { method: 'PUT', body: req });
}

export function deleteTemplate(templateId: number): Promise<void> {
  return apiFetch<void>(`/admin/templates/${templateId}`, { method: 'DELETE' });
}

/** 저장 후 invalidateQueries({ queryKey: templateKeys.all }) 로 관리 표·TemplatePicker 를 함께 갱신 */
export const templateKeys = {
  all: ['templates'] as const,
  list: (query: TemplateQuery) => ['templates', 'list', query] as const,
  admin: (query: TemplateQuery) => ['templates', 'admin', query] as const,
};

/** 치환 변수 — 관리 화면 안내와 TemplatePicker 치환이 같은 목록을 쓴다 */
export const TEMPLATE_VARIABLES = ['{고객명}', '{티켓번호}'] as const;

export interface TemplateContext {
  customerName?: string | null;
  ticketNo?: string | null;
}

/** 값이 없는 변수는 원문 그대로 남겨 상담원이 직접 고치게 한다 */
export function fillTemplate(content: string, { customerName, ticketNo }: TemplateContext): string {
  let text = content;
  if (customerName) text = text.replaceAll('{고객명}', customerName);
  if (ticketNo) text = text.replaceAll('{티켓번호}', ticketNo);
  return text;
}
