// @owner SSJ
// 대시보드 API (docs/04 §13). 타입은 백엔드 DTO 와 같은 이름 — types/ 대신 여기 둔다(소유 파일 안)

import { apiFetch } from './client';

export type DashboardPeriod = 'TODAY' | '7D' | '30D';

/** 비율·평균은 대상이 없으면 null. avgRating 은 설문 연동 전까지 항상 null */
export interface DashboardSummary {
  total: number;
  /** 기간 무관, 현재 미배정 */
  unassigned: number;
  /** 0 ~ 100 */
  slaBreachRate: number | null;
  avgFirstResponseMin: number | null;
  avgRating: number | null;
  /** 많은 순 */
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

/** 상담원별 처리현황. assigned·inProgress 는 현재 담당, resolvedToday 는 오늘 해결 */
export interface AgentStat {
  agentId: number;
  name: string;
  assignedCount: number;
  inProgressCount: number;
  resolvedToday: number;
  avgFirstResponseMin: number | null;
  avgResolveHour: number | null;
  slaBreachRate: number | null;
  avgRating: number | null;
}

/** LEAD+ */
export function getDashboardSummary(period: DashboardPeriod): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>(`/dashboard/summary?period=${period}`);
}

/** LEAD+ */
export function getAgentStats(period: DashboardPeriod): Promise<AgentStat[]> {
  return apiFetch<AgentStat[]>(`/dashboard/agents?period=${period}`);
}

/** 본인 1행 */
export function getMyStat(period: DashboardPeriod): Promise<AgentStat> {
  return apiFetch<AgentStat>(`/dashboard/agents/me?period=${period}`);
}
