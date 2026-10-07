// @owner BSJ
// 상태·우선순위·감정·SLA·AI 배지 (08 §6). 라벨·색은 config/badge.ts 에서만 정의한다
'use client';

import { useSyncExternalStore } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AI_BADGE,
  type BadgeStyle,
  PRIORITY_BADGE,
  SENTIMENT_BADGE,
  SLA_BADGE,
  TICKET_STATUS_BADGE,
} from '@/config/badge';
import { formatDuration } from '@/lib/format';

/** 매핑에 없는 값(백엔드 enum 추가 등)은 원문을 회색으로 — 화면이 깨지지 않게 */
function MappedBadge({ style, raw }: { style: BadgeStyle | undefined; raw: string }) {
  return (
    <Badge className={style?.className ?? 'bg-muted text-muted-foreground rounded-md'}>
      {style?.icon && <style.icon aria-hidden="true" />}
      {style?.label ?? raw}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: keyof typeof TICKET_STATUS_BADGE | string }) {
  return (
    <MappedBadge style={(TICKET_STATUS_BADGE as Record<string, BadgeStyle>)[status]} raw={status} />
  );
}

export function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_BADGE | string }) {
  return (
    <MappedBadge style={(PRIORITY_BADGE as Record<string, BadgeStyle>)[priority]} raw={priority} />
  );
}

/** NEGATIVE 만 표시, 나머지(중립·긍정·null)는 아무것도 그리지 않는다 */
export function SentimentBadge({ sentiment }: { sentiment: string | null | undefined }) {
  if (sentiment !== 'NEGATIVE') return null;
  return <MappedBadge style={SENTIMENT_BADGE.NEGATIVE} raw={sentiment} />;
}

export function AiBadge() {
  return <MappedBadge style={AI_BADGE} raw="AI" />;
}

interface SlaBadgeProps {
  /** 첫 응답 기한 */
  dueAt: string | null | undefined;
  /** 첫 응답 시각. 있으면 SLA 판단 종료 → 배지 없음 */
  respondedAt?: string | null;
  breached?: boolean;
  /** 임박 여부(정책의 warningRatio 기준). 백엔드가 계산해 내려준다 — 프론트는 기준 시각을 모름 */
  warning?: boolean;
}

// 분 단위 공용 시계: 화면의 SLA 배지 전부가 interval 하나를 공유하고 1분마다 다시 그린다
function subscribeMinute(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
// 서버 렌더에는 시각을 쓰지 않는다(null) → 하이드레이션 불일치 없이 브라우저에서 채워진다
const serverMinute = () => null;

/** 여유: 남은 시간 / 임박 / 초과 */
export function SlaBadge({ dueAt, respondedAt, breached, warning }: SlaBadgeProps) {
  const nowMinute = useSyncExternalStore(subscribeMinute, currentMinute, serverMinute);
  if (respondedAt || !dueAt || nowMinute === null) return null;

  const remainMinutes = Math.floor(new Date(dueAt).getTime() / 60_000) - nowMinute;
  const key = breached || remainMinutes < 0 ? 'BREACHED' : warning ? 'WARNING' : 'ON_TRACK';
  const style = SLA_BADGE[key];
  return (
    <Badge className={style.className}>
      <style.icon aria-hidden="true" />
      {key === 'ON_TRACK' ? formatDuration(remainMinutes) : style.label}
    </Badge>
  );
}
