// @owner BSJ
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InquiryDetail } from './inquiry-detail';

export const metadata: Metadata = { title: '문의 상세 | HelpNest' };

/** 문의 상세 (CU-07). 회원 본인 또는 이 티켓의 Guest 토큰 (AuthGuard 는 InquiryDetail 안에서) */
export default async function InquiryDetailPage({ params }: PageProps<'/my/inquiries/[id]'>) {
  const ticketId = Number((await params).id);
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) notFound();
  return <InquiryDetail ticketId={ticketId} />;
}
