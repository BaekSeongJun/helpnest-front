// @owner BSJ
// 역할별 사이드바 메뉴 (docs/09 §2 화면 목록). 메뉴 추가는 백성준에게 CR (docs/02 §3)

import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  ClipboardList,
  FileText,
  HelpCircle,
  Home,
  Inbox,
  MessageCircle,
  MessageSquareText,
  PenSquare,
  Search,
  Star,
  Timer,
  User,
  Users,
} from 'lucide-react';
import type { Role } from '@/types/auth';

/** ANONYMOUS = 로그인하지 않은 방문자(비회원) */
export type MenuAudience = Role | 'ANONYMOUS';

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  audience: readonly MenuAudience[];
}

export interface MenuSection {
  title?: string;
  items: readonly MenuItem[];
}

const AGENT_UP = ['AGENT', 'LEAD', 'ADMIN'] as const;
const LEAD_UP = ['LEAD', 'ADMIN'] as const;

export const MENU: readonly MenuSection[] = [
  {
    items: [
      { label: '홈', href: '/', icon: Home, audience: ['ANONYMOUS', 'CUSTOMER'] },
      {
        label: '자주 묻는 질문',
        href: '/faq',
        icon: HelpCircle,
        audience: ['ANONYMOUS', 'CUSTOMER'],
      },
      {
        label: '문의하기',
        href: '/inquiry/new',
        icon: PenSquare,
        audience: ['ANONYMOUS', 'CUSTOMER'],
      },
      { label: '비회원 문의 조회', href: '/inquiry/lookup', icon: Search, audience: ['ANONYMOUS'] },
      { label: '내 문의', href: '/my/inquiries', icon: ClipboardList, audience: ['CUSTOMER'] },
      { label: '채팅 상담', href: '/chat', icon: MessageCircle, audience: ['CUSTOMER'] },
      { label: '내 정보', href: '/my/profile', icon: User, audience: ['CUSTOMER'] },
    ],
  },
  {
    title: '상담',
    items: [
      { label: '티켓함', href: '/console/tickets', icon: Inbox, audience: AGENT_UP },
      { label: '채팅 상담', href: '/console/chat', icon: MessageSquareText, audience: ['AGENT'] },
      { label: '대시보드', href: '/console/dashboard', icon: BarChart3, audience: AGENT_UP },
      { label: '설문 결과', href: '/console/surveys', icon: Star, audience: AGENT_UP },
      { label: '월간 리포트', href: '/console/reports', icon: FileText, audience: LEAD_UP },
    ],
  },
  {
    title: '관리',
    items: [
      { label: '계정 관리', href: '/admin/members', icon: Users, audience: ['ADMIN'] },
      { label: 'FAQ 관리', href: '/admin/faq', icon: HelpCircle, audience: LEAD_UP },
      {
        label: '템플릿 관리',
        href: '/admin/templates',
        icon: MessageSquareText,
        audience: LEAD_UP,
      },
      { label: 'SLA 정책', href: '/admin/sla', icon: Timer, audience: LEAD_UP },
    ],
  },
  {
    title: '계정',
    items: [{ label: '내 정보', href: '/my/profile', icon: User, audience: AGENT_UP }],
  },
];

/** role 이 볼 수 있는 섹션·메뉴만 남긴다 (비로그인은 null). 빈 섹션은 제외 */
export function getMenu(role: Role | null): MenuSection[] {
  const audience: MenuAudience = role ?? 'ANONYMOUS';
  return MENU.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.audience.includes(audience)),
  })).filter((section) => section.items.length > 0);
}
