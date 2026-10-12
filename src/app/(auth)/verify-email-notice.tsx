// @owner BSJ
'use client';

import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { resendVerificationMail } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

/** 이메일 인증 안내 — 가입 직후와, 인증 전 로그인 시도(AUTH_EMAIL_NOT_VERIFIED) 때 폼 대신 보여 준다 */
export function VerifyEmailNotice({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setState('sending');
    setError(null);
    try {
      await resendVerificationMail(email);
      setState('sent');
    } catch (e) {
      // 요청 제한(429) 등
      setError(
        e instanceof ApiError ? e.message : '보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setState('idle');
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="text-primary size-10" aria-hidden />
        <p className="font-medium">이메일 인증이 필요해요</p>
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{email}</span> 로 인증 링크를 보냈어요.
          링크를 누르면 가입이 끝나요. 링크는 30분 동안 한 번만 쓸 수 있어요.
        </p>
        <p className="text-muted-foreground text-xs">
          메일이 오지 않으면 스팸함을 확인하거나 아래에서 다시 받아 주세요.
        </p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={resend}
          disabled={state !== 'idle'}
        >
          {state === 'sent'
            ? '다시 보냈어요'
            : state === 'sending'
              ? '보내는 중…'
              : '인증 메일 다시 받기'}
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">로그인으로</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
