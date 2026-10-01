// @owner BSJ
import type { Metadata } from 'next';
import { LookupForm } from './lookup-form';

export const metadata: Metadata = { title: '비회원 문의 조회 | HelpNest' };

export default function InquiryLookupPage() {
  return <LookupForm />;
}
