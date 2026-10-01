// @owner BSJ
import type { Metadata } from 'next';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { MyInquiryList } from './my-inquiry-list';

export const metadata: Metadata = { title: '내 문의 | HelpNest' };

export default function MyInquiriesPage() {
  return (
    <AuthGuard roles={['CUSTOMER']}>
      <MyInquiryList />
    </AuthGuard>
  );
}
