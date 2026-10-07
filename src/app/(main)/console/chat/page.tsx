// @owner PMJ
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { AgentChatConsole } from './agent-chat-console';

export const metadata: Metadata = { title: '채팅 상담 | HelpNest' };

/** CS-03 채팅 상담 — 메뉴는 AGENT 에게만 보이지만 담당 방이 없을 뿐 팀장·관리자도 열 수 있다 */
export default function ConsoleChatPage() {
  return (
    <AuthGuard roles={['AGENT', 'LEAD', 'ADMIN']}>
      <AgentChatConsole />
    </AuthGuard>
  );
}
