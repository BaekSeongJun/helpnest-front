// @owner BSJ
// 로그인·회원가입·비밀번호 찾기 (CM-01~04): Header·Sidebar 없이 가운데 카드
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="bg-muted flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <Link href="/" aria-label="HelpNest 홈">
        <Logo className="text-2xl" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
