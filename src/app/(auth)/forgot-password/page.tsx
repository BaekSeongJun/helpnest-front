// @owner BSJ
import type { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = { title: '비밀번호 찾기 | HelpNest' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
