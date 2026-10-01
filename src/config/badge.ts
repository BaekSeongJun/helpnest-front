// @owner BSJ
// 코드 값 → 배지 라벨·색 (docs/08 §6). 한글 라벨은 이 파일에서만 정의한다.
// 사용: <Badge className={TICKET_STATUS_BADGE[status].className}>{TICKET_STATUS_BADGE[status].label}</Badge>
//   (cn 이 tailwind-merge 처럼 동작해 className 이 Badge 기본 variant 색을 덮어쓴다)
// 키 값은 백엔드 enum 과 동일 — 타입 정의는 각 도메인 types/*.ts(ticket.ts 박민재) 소유

import type { Role } from '@/types/auth';
import type { MemberStatus } from '@/types/member';
import type { TicketCategory } from '@/types/ticket';

export interface BadgeStyle {
  label: string;
  className: string;
}

// 의미 토큰만 사용 (D1). 색만으로 구분하지 않도록 항상 label 을 함께 표시
const tone = {
  muted: 'bg-muted text-muted-foreground',
  mutedOutline: 'border-border bg-transparent text-muted-foreground',
  info: 'bg-info text-info-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-white',
  destructiveOutline: 'border-destructive bg-transparent text-destructive',
} as const;

export const TICKET_STATUS_BADGE = {
  RECEIVED: { label: '접수', className: tone.muted },
  ASSIGNED: { label: '배정', className: tone.info },
  IN_PROGRESS: { label: '처리중', className: tone.primary },
  RESOLVED: { label: '해결', className: tone.success },
  CLOSED: { label: '종료', className: tone.mutedOutline },
} as const satisfies Record<string, BadgeStyle>;

export const PRIORITY_BADGE = {
  URGENT: { label: '긴급', className: tone.destructive },
  HIGH: { label: '높음', className: tone.warning },
  NORMAL: { label: '보통', className: tone.secondary },
  LOW: { label: '낮음', className: tone.mutedOutline },
} as const satisfies Record<string, BadgeStyle>;

/** NEGATIVE 만 배지로 표시 (08 §6). 나머지는 배지 없음 */
export const SENTIMENT_BADGE = {
  NEGATIVE: { label: '불만', className: tone.destructiveOutline },
} as const satisfies Record<string, BadgeStyle>;

/** SLA 여유 구간의 label 은 남은 시간이라 SlaBadge 가 formatDuration 으로 채운다 */
export const SLA_BADGE = {
  ON_TRACK: { label: '', className: tone.muted },
  WARNING: { label: '임박', className: tone.warning },
  BREACHED: { label: '초과', className: tone.destructive },
} as const satisfies Record<string, BadgeStyle>;

export const CHAT_STATUS_BADGE = {
  WAITING: { label: '대기', className: tone.warning },
  OPEN: { label: '상담중', className: tone.primary },
  CLOSED: { label: '종료', className: tone.muted },
} as const satisfies Record<string, BadgeStyle>;

/** 문의 유형은 배지 색 없이 라벨만 (CR #6). TicketCategory 가 늘면 여기서 컴파일 에러로 드러난다 */
export const CATEGORY_LABEL = {
  DELIVERY: '배송',
  REFUND: '환불',
  EXCHANGE: '교환',
  PAYMENT: '결제',
  ACCOUNT: '계정',
  SERVICE_ERROR: '서비스 오류',
  ETC: '기타',
} as const satisfies Record<TicketCategory, string>;

export const ROLE_LABEL = {
  CUSTOMER: '고객',
  AGENT: '상담원',
  LEAD: '팀장',
  ADMIN: '관리자',
} as const satisfies Record<Role, string>;

export const MEMBER_STATUS_BADGE = {
  ACTIVE: { label: '활성', className: tone.success },
  INACTIVE: { label: '비활성', className: tone.muted },
} as const satisfies Record<MemberStatus, BadgeStyle>;

export const AI_BADGE: BadgeStyle = { label: 'AI', className: 'bg-ai text-ai-foreground' };
