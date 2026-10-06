// @owner SSJ
// 월간 리포트·CSV 다운로드 API (docs/04 §13). 타입은 백엔드 DTO 와 같은 이름 — 소유 파일 안에 둔다

import { apiFetchBlob, apiFetch } from './client';
import type { DashboardPeriod } from './dashboard';

/** 유형별 행. 전월에만 있던 유형은 count=0, 지표 null */
export interface CategoryRow {
  category: string;
  count: number;
  prevCount: number;
  avgResolveHour: number | null;
  /** 0 ~ 100 */
  negativeRate: number | null;
}

/** 그 달(서울)에 접수된 티켓 기준. 비율 0~100, 대상 없으면 null. avgRating 은 설문 연동 전까지 null */
export interface MonthlyReport {
  /** YYYY-MM */
  month: string;
  total: number;
  prevTotal: number;
  avgFirstResponseMin: number | null;
  avgResolveHour: number | null;
  slaBreachRate: number | null;
  negativeRate: number | null;
  avgRating: number | null;
  byCategory: CategoryRow[];
}

/** 서울 기준 오늘 YYYY-MM-DD (서버 파일명·기본 월과 같은 기준) */
export function seoulToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** LEAD+. month 생략 시 서버가 이번 달(서울) */
export function getMonthlyReport(month: string): Promise<MonthlyReport> {
  return apiFetch<MonthlyReport>(`/reports/monthly?month=${month}`);
}

export async function downloadReportCsv(month: string): Promise<void> {
  saveBlob(
    await apiFetchBlob(`/reports/monthly/export?month=${month}`),
    `helpnest_report_${month}.csv`,
  );
}

export async function downloadAgentsCsv(period: DashboardPeriod): Promise<void> {
  saveBlob(
    await apiFetchBlob(`/dashboard/agents/export?period=${period}`),
    `helpnest_agents_${period}_${seoulToday().replaceAll('-', '')}.csv`,
  );
}

// Authorization 헤더가 필요해 링크 대신 받아서 저장시킨다 (lib/api/attachment.ts 와 같은 방식)
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
