// @owner SSJ
import type { Metadata } from 'next';
import { VerifyEmailForm } from './verify-email-form';

export const metadata: Metadata = { title: '이메일 인증 | HelpNest' };

/** 이메일 인증 (back #117). 인증 메일 링크 ?token= 으로 들어온다 */
export default async function VerifyEmailPage({ searchParams }: PageProps<'/verify-email'>) {
  const { token } = await searchParams;
  return <VerifyEmailForm token={typeof token === 'string' ? token : ''} />;
}
