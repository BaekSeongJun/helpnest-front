// @owner BSJ
import type { Metadata } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'HelpNest',
  description: 'AI 고객상담 헬프데스크',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        {/* 저장 성공/실패 토스트: 우하단 3초 (08 §7) */}
        <Toaster position="bottom-right" duration={3000} />
      </body>
    </html>
  );
}
