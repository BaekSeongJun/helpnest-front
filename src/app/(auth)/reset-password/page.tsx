// @owner BSJ
import type { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = { title: '비밀번호 재설정 | HelpNest' };

/** 비밀번호 재설정 (CM-04). 메일 링크 ?token= 으로 들어온다 */
export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === 'string' ? token : ''} />;
}
