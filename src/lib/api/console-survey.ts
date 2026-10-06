// @owner BSJ
// 설문 결과 API (docs/04 §5, CS-06). 고객용 설문 제출(/surveys/{token})과 다른 경로라 파일을 나눴다
import type { PageResponse } from '@/types/api';
import type { TicketCategory } from '@/types/ticket';
import { apiFetch } from './client';

export interface SurveyResult {
  /** 행 클릭 → 티켓 상세(CS-02) */
  ticketId: number;
  ticketNo: string;
  customerName: string | null;
  /** 담당자가 없는 티켓이면 null */
  agentName: string | null;
  rating: number;
  comment: string | null;
  submittedAt: string;
}

export interface SurveySummary {
  sent: number;
  responded: number;
  /** 0~100(%). 발송이 없으면 null */
  responseRate: number | null;
  /** 소수 1자리. 응답이 없으면 null */
  avgRating: number | null;
  /** 키 "1"~"5" 가 항상 있다 */
  distribution: Record<string, number>;
}

/** from·to 는 yyyy-MM-dd, 발송일 기준(양끝 포함). AGENT 는 agentId 를 보내도 서버가 본인으로 고정한다 */
export interface SurveySummaryQuery {
  from?: string;
  to?: string;
  agentId?: number;
  category?: TicketCategory;
}

export interface SurveyResultQuery extends SurveySummaryQuery {
  rating?: number;
  page?: number;
  size?: number;
}

function toQuery(query: SurveyResultQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function getSurveyResults(query: SurveyResultQuery): Promise<PageResponse<SurveyResult>> {
  return apiFetch<PageResponse<SurveyResult>>(`/console/surveys${toQuery(query)}`);
}

/** 별점(rating) 필터는 받지 않는다 — 분포가 곧 별점 축이라 서버도 무시한다 */
export function getSurveySummary(query: SurveySummaryQuery): Promise<SurveySummary> {
  return apiFetch<SurveySummary>(`/console/surveys/summary${toQuery(query)}`);
}

export const surveyResultKeys = {
  list: (query: SurveyResultQuery) => ['console', 'surveys', 'list', query] as const,
  summary: (query: SurveySummaryQuery) => ['console', 'surveys', 'summary', query] as const,
};
