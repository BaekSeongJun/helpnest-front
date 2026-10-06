// @owner PMJ
// 알림 API (docs/04 §9) + STOMP 푸시와 공유하는 타입. 화면은 CS-08 Header 드롭다운.
// apiFetch 가 경로 앞에 /api 를 붙이므로 아래 경로에는 /api 를 적지 않는다.

import { apiFetch } from './client';

/**
 * 알림 종류. 백엔드 `NotificationType` 과 값이 같다.
 * 라벨은 알림 본문(`message`)이 이미 한국어 문장이라 따로 두지 않는다 — 두 군데서 문구를
 * 만들면 웹 알림과 메일이 다른 말을 하게 된다.
 */
export type NotificationType =
  | 'ASSIGNED'
  | 'SLA_WARNING'
  | 'SLA_BREACHED'
  | 'CUSTOMER_REPLY'
  | 'AGENT_REPLY'
  | 'STATUS_CHANGED'
  | 'UNASSIGNED'
  | 'CHAT_REQUEST';

/**
 * 알림 1건. **REST 조회와 STOMP 푸시가 같은 모양이다** — 백엔드가 `NotificationPayload`
 * 하나를 두 경로에 재사용하므로(docs/04 §9·§11) 프론트도 타입 하나로 받는다. 푸시로 온
 * 알림을 목록 맨 앞에 그대로 끼워 넣을 수 있는 이유다.
 *
 * `type` 을 유니온이 아니라 `string` 으로도 받는 이유: S3 에서 백엔드에 종류가 추가되면
 * 프론트가 모르는 값이 내려온다. 그때 화면이 깨지는 대신 아이콘만 기본값으로 떨어뜨린다.
 */
export interface NotificationItem {
  notificationId: number;
  type: NotificationType | string;
  ticketId: number | null;
  message: string;
  createdAt: string;
}

export interface UnreadCount {
  unreadCount: number;
}

export interface ReadAllResult {
  updated: number;
}

/** 최근 알림. 서버가 최신순 20건으로 상한을 둔다 — 페이징 없음이 명세다(docs/04 §9) */
export function getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  return apiFetch<NotificationItem[]>(`/notifications?unreadOnly=${unreadOnly}`);
}

/** 벨 배지 숫자 */
export function getUnreadCount(): Promise<UnreadCount> {
  return apiFetch<UnreadCount>('/notifications/unread-count');
}

/** 내 알림이 아니거나 없으면 404 다(403 이 아니다 — 존재를 노출하지 않으려고) */
export function markNotificationRead(notificationId: number): Promise<void> {
  return apiFetch<void>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<ReadAllResult> {
  return apiFetch<ReadAllResult>('/notifications/read-all', { method: 'PATCH' });
}

/**
 * 쿼리 키. 푸시를 받으면 `invalidateQueries({ queryKey: notificationKeys.all })` 로
 * 목록과 미읽음 수를 한 번에 되살린다 — 둘이 따로 갱신되면 "배지는 3인데 목록은 2건"이 된다.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly: boolean) => ['notifications', 'list', unreadOnly] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};
