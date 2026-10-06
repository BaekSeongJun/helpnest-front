// @owner BSJ
// 만족도 설문 API (docs/04 §5). 메일의 토큰으로만 접근하므로 로그인 없이 호출한다
import type { Survey, SurveySubmitRequest } from '@/types/survey';
import { apiFetch } from './client';

export function getSurvey(token: string): Promise<Survey> {
  return apiFetch<Survey>(`/surveys/${encodeURIComponent(token)}`);
}

/** 1회만 제출된다. 이미 제출(409)·만료(410)면 ApiError */
export function submitSurvey(token: string, req: SurveySubmitRequest): Promise<void> {
  return apiFetch<void>(`/surveys/${encodeURIComponent(token)}`, { method: 'POST', body: req });
}
