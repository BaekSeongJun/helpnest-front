// @owner BSJ
import type { Metadata } from 'next';
import { oauthErrorMessage } from '../social-buttons';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: '로그인 | HelpNest' };

/** ?error= 는 소셜 로그인 실패 시 백엔드가 붙여 보낸다 */
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { error } = await searchParams;
  return (
    <LoginForm initialError={oauthErrorMessage(typeof error === 'string' ? error : undefined)} />
  );
}
