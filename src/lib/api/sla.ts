// @owner PMJ
// SLA 정책 API (docs/04 §8). 화면 AD-04. 조회는 LEAD+, 수정은 ADMIN 전용(서버가 막는다).
// apiFetch 가 경로 앞에 /api 를 붙이므로 아래 경로에는 /api 를 적지 않는다.

import type { TicketPriority } from '@/types/ticket';
import { apiFetch } from './client';

/**
 * 우선순위 한 줄의 정책.
 *
 * `warningMinutes` 는 **서버가 계산해 내려주는 값**이다(`responseMinutes × warningRatio`).
 * 화면에서 다시 곱하지 않는다 — 반올림 방식까지 따라 구현해야 하고, 어긋나는 순간 관리
 * 화면이 말하는 임박 시각과 실제 알림이 갈린다(백엔드 `SlaPolicyResponse` 주석).
 */
export interface SlaPolicy {
  priority: TicketPriority;
  responseMinutes: number;
  /** 0.01~1.00, 소수 두 자리. JSON 숫자로 내려온다 */
  warningRatio: number;
  warningMinutes: number;
  updatedAt: string;
}

export interface SlaPolicyUpdate {
  responseMinutes: number;
  warningRatio: number;
}

export function getSlaPolicies(): Promise<SlaPolicy[]> {
  return apiFetch<SlaPolicy[]>('/admin/sla-policies');
}

/** ADMIN 만 가능. LEAD 가 부르면 403 이다 */
export function updateSlaPolicy(
  priority: TicketPriority,
  body: SlaPolicyUpdate,
): Promise<SlaPolicy> {
  return apiFetch<SlaPolicy>(`/admin/sla-policies/${priority}`, { method: 'PUT', body });
}

export const slaKeys = {
  all: ['sla-policies'] as const,
};
