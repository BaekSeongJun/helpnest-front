// @owner PMJ
// 채팅 REST (docs/04 §10). 메시지 송신은 STOMP(`/app/chat/{roomId}/send`)라 여기 없다.
// apiFetch 가 경로 앞에 /api 를 붙이므로 아래 경로에는 /api 를 적지 않는다.

import type { ChatMessage, ChatRoom, ChatStatusPayload } from '@/types/chat';
import { apiFetch } from './client';

/** 메시지 최대 길이 — 서버 ChatMessageService 와 같다 */
export const CHAT_MESSAGE_MAX_LENGTH = 5000;

/** 대기 시간 초과 기준(PRD Q16). 화면 안내용이며 최종 판단은 서버가 전환 시 다시 한다 */
export const CHAT_WAIT_LIMIT_MS = 5 * 60 * 1000;

/** 채팅 요청. 진행 중 방이 있으면 서버가 그 방의 현재 상태를 돌려준다(새 방을 만들지 않음) */
export function requestChat(): Promise<ChatStatusPayload> {
  return apiFetch<ChatStatusPayload>('/chat/rooms', { method: 'POST' });
}

/** 고객은 본인 방, 상담원은 담당 방 — 최근 50개, 최신순 */
export function getChatRooms(): Promise<ChatRoom[]> {
  return apiFetch<ChatRoom[]>('/chat/rooms');
}

/** 이전 메시지. 오래된 순으로 온다. before 를 주면 그보다 앞선 것만 */
export function getChatMessages(roomId: number, before?: number, size = 50): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ size: String(size) });
  if (before !== undefined) params.set('before', String(before));
  return apiFetch<ChatMessage[]>(`/chat/rooms/${roomId}/messages?${params}`);
}

/** 대기 5분 초과 후 "문의로 남기기" → 생성된 티켓번호 */
export function convertChat(roomId: number): Promise<{ ticketNo: string }> {
  return apiFetch<{ ticketNo: string }>(`/chat/rooms/${roomId}/convert`, { method: 'POST' });
}

/** 대기 중 나가기 */
export function cancelChat(roomId: number): Promise<void> {
  return apiFetch<void>(`/chat/rooms/${roomId}`, { method: 'DELETE' });
}

/** 상담원 종료. resolve 면 티켓도 해결 처리 */
export function closeChat(roomId: number, resolve: boolean): Promise<void> {
  return apiFetch<void>(`/chat/rooms/${roomId}/close`, { method: 'PATCH', body: { resolve } });
}

export const chatKeys = {
  rooms: ['chat', 'rooms'] as const,
};
