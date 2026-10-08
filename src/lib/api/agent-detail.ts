// @owner BSJ
// 상담원 개인 상세 API (docs/04 §13.x, LEAD+). 대시보드 기간·AgentStat 은 신수진 dashboard.ts 재사용 (back #112)
import type { AgentStat, DashboardPeriod } from './dashboard';
import { apiFetch } from './client';

/** 건수는 0건 상담원 포함 평균, 시간·비율·만족도는 값이 있는 상담원만 평균(없으면 null) */
export interface TeamAverage {
  agentCount: number;
  assignedCount: number;
  inProgressCount: number;
  resolvedToday: number;
  avgFirstResponseMin: number | null;
  avgResolveHour: number | null;
  slaBreachRate: number | null;
  avgRating: number | null;
}

export interface AgentDaily {
  /** 서울 날짜 yyyy-MM-dd */
  day: string;
  received: number;
  resolved: number;
  avgFirstResponseMin: number | null;
}

export interface AgentBreakdown {
  /** category 또는 priority 값 */
  key: string;
  count: number;
  avgResolveHour: number | null;
  slaBreachRate: number | null;
}

export interface AgentRecentTicket {
  ticketId: number;
  ticketNo: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  slaBreached: boolean;
  createdAt: string;
}

export interface AgentRecentSurvey {
  ticketId: number;
  ticketNo: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
}

export interface AgentDetail {
  agent: AgentStat;
  teamAverage: TeamAverage;
  daily: AgentDaily[];
  byCategory: AgentBreakdown[];
  byPriority: AgentBreakdown[];
  /** 최근 20건 */
  tickets: AgentRecentTicket[];
  /** 최근 20건, 제출분만 */
  surveys: AgentRecentSurvey[];
}

export function getAgentDetail(agentId: number, period: DashboardPeriod): Promise<AgentDetail> {
  return apiFetch<AgentDetail>(`/dashboard/agents/${agentId}/detail?period=${period}`);
}
