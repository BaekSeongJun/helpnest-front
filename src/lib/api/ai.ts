// @owner SSJ
// AI API (docs/04 §12)

import type { AiResult } from '@/types/ai';
import { apiFetch } from './client';

/** 결과가 아직 없으면(비동기 분류 진행 중) null */
export function getAiResult(ticketId: number): Promise<AiResult | null> {
  return apiFetch<AiResult | null>(`/console/tickets/${ticketId}/ai`);
}

/** 동기 재분류 (최대 ~20초). LLM 실패도 status=FAILED 로 정상 응답 */
export function reclassify(ticketId: number): Promise<AiResult> {
  return apiFetch<AiResult>(`/console/tickets/${ticketId}/ai/classify`, { method: 'POST' });
}
