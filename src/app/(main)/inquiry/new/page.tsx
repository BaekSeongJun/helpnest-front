// @owner BSJ
import type { Metadata } from 'next';
import { InquiryForm } from './inquiry-form';

export const metadata: Metadata = { title: '문의하기 | HelpNest' };

export default function InquiryNewPage() {
  return <InquiryForm />;
}
