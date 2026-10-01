// @owner BSJ
import type { Metadata } from 'next';
import { FaqList } from './faq-list';

export const metadata: Metadata = { title: '자주 묻는 질문 | HelpNest' };

export default function FaqPage() {
  return <FaqList />;
}
