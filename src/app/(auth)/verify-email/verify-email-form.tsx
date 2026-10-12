// @owner SSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, LinkIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { resendVerificationMail } from '@/lib/api/auth';
import { ApiError, apiFetch } from '@/lib/api/client';
import { VerifyEmailNotice } from '../verify-email-notice';

const LOGIN_REDIRECT_MS = 3000;

const schema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다').max(100, '이메일은 100자 이하로 입력해 주세요'),
});

/** 링크 확인 → 성공이면 로그인으로, 없음·만료·사용됨은 같은 실패 화면에서 다시 받기 */
export function VerifyEmailForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<'verifying' | 'done' | 'failed'>(
    token ? 'verifying' : 'failed',
  );
  const [failMessage, setFailMessage] = useState<string | null>(null);
  // 토큰은 1회용 — StrictMode 의 effect 2회 실행으로 두 번째 요청이 '사용됨' 실패가 되지 않게
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;
    apiFetch<void>('/auth/email/verify', { method: 'POST', body: { token } })
      .then(() => setState('done'))
      .catch((e) => {
        setFailMessage(e instanceof ApiError ? e.message : null);
        setState('failed');
      });
  }, [token]);

  useEffect(() => {
    if (state !== 'done') return;
    const timer = setTimeout(() => router.replace('/login'), LOGIN_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [state, router]);

  if (state === 'verifying') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="text-muted-foreground size-10 animate-spin" aria-hidden />
          <p className="font-medium" role="status">
            이메일을 인증하고 있어요…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state === 'done') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <CircleCheck className="text-success size-10" aria-hidden />
          <p className="font-medium">이메일 인증이 끝났어요</p>
          <p className="text-muted-foreground text-sm">잠시 후 로그인 화면으로 이동해요.</p>
          <Button asChild className="mt-2 w-full">
            <Link href="/login">로그인</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ResendForm message={failMessage} />;
}

/** 실패 화면: 이메일을 받아 인증 메일을 다시 보낸다. 가입 여부와 무관하게 같은 안내(VerifyEmailNotice) */
function ResendForm({ message }: { message: string | null }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: z.infer<typeof schema>) {
    setServerError(null);
    try {
      await resendVerificationMail(email);
      setSentTo(email);
    } catch (e) {
      // 요청 제한(429) 등
      setServerError(
        e instanceof ApiError ? e.message : '보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  if (sentTo) return <VerifyEmailNotice email={sentTo} />;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <LinkIcon className="text-muted-foreground size-10" aria-hidden />
          <p className="font-medium">인증 링크를 쓸 수 없어요</p>
          <p className="text-muted-foreground text-sm">
            {message ??
              '링크가 만료되었거나 이미 사용되었습니다. 가입한 이메일로 다시 받아 주세요.'}
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">이메일</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '보내는 중…' : '인증 메일 다시 받기'}
            </Button>
          </FieldGroup>
        </form>
        <div className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="hover:text-foreground">
            로그인으로 돌아가기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
