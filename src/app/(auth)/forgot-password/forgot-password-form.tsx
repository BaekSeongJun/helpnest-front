// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { requestPasswordReset } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const schema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다').max(100, '이메일은 100자 이하로 입력해 주세요'),
});

/** 비밀번호 찾기 (CM-03). 가입 여부와 무관하게 같은 안내 — 계정 존재를 화면으로도 드러내지 않는다 */
export function ForgotPasswordForm() {
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
      await requestPasswordReset(email);
      setSentTo(email);
    } catch (e) {
      // 요청 제한(429) 등. 가입 여부와 관련된 오류는 서버가 주지 않는다
      setServerError(
        e instanceof ApiError ? e.message : '요청하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  if (sentTo) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="text-primary size-10" aria-hidden />
          <p className="font-medium">메일을 확인해 주세요</p>
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">{sentTo}</span> 로 가입된 계정이 있으면
            비밀번호 재설정 링크를 보냈어요. 링크는 30분 동안 한 번만 쓸 수 있어요.
          </p>
          <p className="text-muted-foreground text-xs">
            메일이 오지 않으면 스팸함을 확인하거나 잠시 후 다시 요청해 주세요.
          </p>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/login">로그인으로</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">비밀번호 찾기</CardTitle>
        <CardDescription>가입한 이메일로 비밀번호 재설정 링크를 보내 드려요.</CardDescription>
      </CardHeader>
      <CardContent>
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
              {isSubmitting ? '보내는 중…' : '재설정 링크 받기'}
            </Button>
          </FieldGroup>
        </form>
        <div className="text-muted-foreground mt-6 text-center text-sm">
          <Link href="/login" className="hover:text-foreground">
            로그인으로 돌아가기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
