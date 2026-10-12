// @owner BSJ
import type { Metadata } from 'next';
import { FaqList } from './faq-list';

export const metadata: Metadata = { title: '자주 묻는 질문 | HelpNest' };

/** ?keyword= 는 홈(CU-01) 검색창에서 넘어온다 */
export default async function FaqPage({ searchParams }: PageProps<'/faq'>) {
  const { keyword } = await searchParams;
  return <FaqList initialKeyword={typeof keyword === 'string' ? keyword : ''} />;
}
