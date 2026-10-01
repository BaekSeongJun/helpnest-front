// @owner PMJ
// 배정 드롭다운용 상담원 목록 (back CR #44 → GET /api/console/agents, 백성준 구현).
// 관리용 /admin/members(ADMIN 전용, lib/api/member.ts)와 다르다 — 이쪽은 AGENT+ 이고
// 이름·가용 여부·처리 중 건수만 내려온다(개인정보 없음).
import { apiFetch } from './client';

export interface ConsoleAgent {
  memberId: number;
  name: string;
  available: boolean;
  /** 처리 중 티켓 수 (ASSIGNED + IN_PROGRESS) */
  activeCount: number;
}

export function getConsoleAgents(): Promise<ConsoleAgent[]> {
  return apiFetch<ConsoleAgent[]>('/console/agents');
}

export const consoleAgentKeys = {
  all: ['console', 'agents'] as const,
};
