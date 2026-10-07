// @owner BSJ
// 코드 값 → 배지 라벨·색 (docs/08 §6). 한글 라벨은 이 파일에서만 정의한다.
// 사용: <Badge className={TICKET_STATUS_BADGE[status].className}>{TICKET_STATUS_BADGE[status].label}</Badge>
//   (cn 이 tailwind-merge 처럼 동작해 className 이 Badge 기본 variant 색을 덮어쓴다)
// 키 값은 백엔드 enum 과 동일 — 타입 정의는 각 도메인 types/*.ts(ticket.ts 박민재) 소유

import type { LucideIcon } from 'lucide-react';
import {
  AlarmClockOff,
  Archive,
  ArrowDown,
  ArrowUp,
  CircleCheck,
  CircleDot,
  Clock,
  Frown,
  Hourglass,
  Inbox,
  MessageCircle,
  MessageCircleOff,
  Minus,
  Siren,
  Sparkles,
  Timer,
  UserCheck,
} from 'lucide-react';
import type { Role } from '@/types/auth';
import type { MemberStatus } from '@/types/member';
import type { TicketCategory } from '@/types/ticket';

export interface BadgeStyle {
  label: string;
  className: string;
  /** 시안 A안: 배지 앞 아이콘 (StatusBadge 등 common/badges 가 그린다) */
  icon?: LucideIcon;
}

// 의미 토큰만 사용 (D1). 색만으로 구분하지 않도록 항상 label 을 함께 표시
// 시안 A안: 옅은 배경(10%)+테두리(20%) 틴트, 모서리 6px. 긴급·SLA 초과만 채운 빨강
const tone = {
  muted: 'rounded-md border-border bg-muted text-muted-foreground',
  mutedOutline: 'rounded-md border-input bg-transparent text-muted-foreground',
  info: 'rounded-md border-info/20 bg-info/10 text-info',
  primary: 'rounded-md border-primary/20 bg-primary/10 text-primary',
  secondary: 'rounded-md border-border bg-secondary text-secondary-foreground',
  success: 'rounded-md border-success/20 bg-success/10 text-success',
  warning: 'rounded-md border-warning/25 bg-warning/10 text-warning',
  destructive:
    'rounded-md border-destructive bg-destructive font-semibold text-white dark:text-background',
  destructiveOutline: 'rounded-md border-destructive/40 bg-transparent text-destructive',
} as const;

export const TICKET_STATUS_BADGE = {
  RECEIVED: { label: '접수', className: tone.muted, icon: Inbox },
  ASSIGNED: { label: '배정', className: tone.info, icon: UserCheck },
  IN_PROGRESS: { label: '처리중', className: tone.primary, icon: CircleDot },
  RESOLVED: { label: '해결', className: tone.success, icon: CircleCheck },
  CLOSED: { label: '종료', className: tone.mutedOutline, icon: Archive },
} as const satisfies Record<string, BadgeStyle>;

export const PRIORITY_BADGE = {
  URGENT: { label: '긴급', className: tone.destructive, icon: Siren },
  HIGH: { label: '높음', className: tone.warning, icon: ArrowUp },
  NORMAL: { label: '보통', className: tone.secondary, icon: Minus },
  LOW: { label: '낮음', className: tone.mutedOutline, icon: ArrowDown },
} as const satisfies Record<string, BadgeStyle>;

/** NEGATIVE 만 배지로 표시 (08 §6). 나머지는 배지 없음 */
export const SENTIMENT_BADGE = {
  NEGATIVE: { label: '불만', className: tone.destructiveOutline, icon: Frown },
} as const satisfies Record<string, BadgeStyle>;

/** SLA 여유 구간의 label 은 남은 시간이라 SlaBadge 가 formatDuration 으로 채운다 */
export const SLA_BADGE = {
  ON_TRACK: { label: '', className: tone.muted, icon: Clock },
  WARNING: { label: '임박', className: tone.warning, icon: Timer },
  BREACHED: { label: '초과', className: tone.destructive, icon: AlarmClockOff },
} as const satisfies Record<string, BadgeStyle>;

export const CHAT_STATUS_BADGE = {
  WAITING: { label: '대기', className: tone.warning, icon: Hourglass },
  OPEN: { label: '상담중', className: tone.primary, icon: MessageCircle },
  CLOSED: { label: '종료', className: tone.muted, icon: MessageCircleOff },
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

/** 고객 이력(CS-07) 회원·비회원 구분 */
export const CUSTOMER_TYPE_BADGE = {
  MEMBER: { label: '회원', className: tone.secondary },
  GUEST: { label: '비회원', className: tone.mutedOutline },
} as const satisfies Record<string, BadgeStyle>;

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

export const AI_BADGE: BadgeStyle = {
  label: 'AI',
  className: 'rounded-md border-ai/20 bg-ai/10 text-ai',
  icon: Sparkles,
};
