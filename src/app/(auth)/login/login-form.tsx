// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/use-auth';
import type { Role } from '@/types/auth';
import { type LoginValues, loginSchema } from './schema';

/** ?next= 가 같은 사이트 경로일 때만 사용 (//evil.com 같은 외부 이동 차단), 없으면 역할별 기본 화면 */
export function redirectTarget(role: Role) {
  const next = new URLSearchParams(window.location.search).get('next');
  if (next?.startsWith('/') && !next.startsWith('//')) return next;
  return role === 'CUSTOMER' ? '/' : '/console/tickets';
}

export function LoginForm() {
  const router = useRouter();
  const { status, member } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // 로그인 성공 직후와, 이미 로그인한 채로 /login 에 온 경우 모두 여기서 이동
  useEffect(() => {
    if (status === 'authenticated' && member) router.replace(redirectTarget(member.role));
  }, [status, member, router]);

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">로그인</CardTitle>
        <CardDescription>이메일과 비밀번호를 입력해 주세요.</CardDescription>
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
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">비밀번호</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '로그인 중…' : '로그인'}
            </Button>
          </FieldGroup>
        </form>
        <div className="text-muted-foreground mt-6 flex justify-center gap-3 text-sm">
          <Link href="/forgot-password" className="hover:text-foreground">
            비밀번호 찾기
          </Link>
          <span aria-hidden>·</span>
          <Link href="/signup" className="hover:text-foreground">
            회원가입
          </Link>
          <span aria-hidden>·</span>
          <Link href="/inquiry/lookup" className="hover:text-foreground">
            비회원 문의 조회
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
