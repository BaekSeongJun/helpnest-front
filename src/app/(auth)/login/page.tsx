// @owner BSJ
import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: '로그인 | HelpNest' };

export default function LoginPage() {
  return <LoginForm />;
}
