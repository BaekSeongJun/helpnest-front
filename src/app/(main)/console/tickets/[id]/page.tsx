// @owner PMJ
// CS-02 콘솔 티켓 상세 (docs/09 §2.3). M1 핵심 흐름의 종착점 — 상담원이 답변하고 해결 처리하는 화면
import { notFound } from 'next/navigation';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { TicketDetailView } from './ticket-detail-view';

export default async function ConsoleTicketDetailPage({
  params,
}: PageProps<'/console/tickets/[id]'>) {
  const { id } = await params;
  const ticketId = Number(id);
  // 숫자가 아닌 경로는 API 를 때리기 전에 끊는다
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  return (
    <AuthGuard roles={['AGENT', 'LEAD', 'ADMIN']}>
      <TicketDetailView ticketId={ticketId} />
    </AuthGuard>
  );
}
