// @owner PMJ
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { CustomerChat } from './customer-chat';

export const metadata: Metadata = { title: '1:1 채팅 상담 | HelpNest' };

/** CU-09 1:1 채팅 — 회원 고객만 (PRD Q6) */
export default function ChatPage() {
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <CustomerChat />
    </AuthGuard>
  );
}
