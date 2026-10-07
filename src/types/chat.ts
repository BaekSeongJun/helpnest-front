// @owner PMJ
// 채팅 타입 (docs/04 §10·§11). 백엔드 domain/chat/dto 와 모양이 같다.

/** 저장되는 방 상태. 배지는 config/badge.ts CHAT_STATUS_BADGE */
export type ChatRoomStatus = 'WAITING' | 'OPEN' | 'CLOSED' | 'CONVERTED' | 'CANCELED';

/**
 * 고객 대기열 상태 — `POST /chat/rooms` 응답과 `/user/queue/chat-status` 푸시가 같은 모양이다.
 * `TIMEOUT` 은 저장 상태가 아니라 "WAITING 이면서 5분이 지났음"이다(FR-CHT-05).
 */
export interface ChatStatusPayload {
  roomId: number;
  status: ChatRoomStatus | 'TIMEOUT';
  /** 대기 순번(1부터). WAITING·TIMEOUT 이 아니면 null */
  position: number | null;
  queuedAt: string;
  agentName: string | null;
}

/** 이전 메시지 조회 응답과 `/topic/chat/{roomId}` 푸시가 같은 모양이다 */
export interface ChatMessage {
  messageId: number;
  senderId: number;
  senderName: string | null;
  content: string;
  createdAt: string;
}

/** 방 목록 한 줄 (GET /chat/rooms) */
export interface ChatRoom {
  roomId: number;
  status: ChatRoomStatus;
  ticketId: number | null;
  customerId: number;
  customerName: string | null;
  agentName: string | null;
  queuedAt: string;
  openedAt: string | null;
  closedAt: string | null;
}

/** STOMP 송신 거부 사유 (`/user/queue/errors`) */
export interface ChatError {
  code: string;
  message: string;
}
