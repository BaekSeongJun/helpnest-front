// @owner BSJ
// CS-09 상담원 상세 (docs/09 §2.3, LEAD+). 대시보드 상담원 표에서 들어온다 (back #112)
import { notFound } from 'next/navigation';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { AgentDetailView } from './agent-detail-view';

export default async function ConsoleAgentPage({ params }: PageProps<'/console/agents/[id]'>) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return (
    <AuthGuard roles={['LEAD', 'ADMIN']}>
      <AgentDetailView agentId={Number(id)} />
    </AuthGuard>
  );
}
