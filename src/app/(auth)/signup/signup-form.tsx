// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { login, signup } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/use-auth';
import { redirectTarget } from '../login/login-form';
import { type SignupValues, signupSchema } from './schema';

/** 고객 회원가입 (CM-02). 성공하면 같은 계정으로 바로 로그인 → ?next 또는 홈 */
export function SignupForm() {
  const router = useRouter();
  const { status, member } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', passwordConfirm: '', name: '', phone: '' },
  });

  // 자동 로그인 직후와, 이미 로그인한 채로 /signup 에 온 경우 모두 여기서 이동
  useEffect(() => {
    if (status === 'authenticated' && member) router.replace(redirectTarget(member.role));
  }, [status, member, router]);

  async function onSubmit({ email, password, name, phone }: SignupValues) {
    setServerError(null);
    try {
      await signup({ email, password, name, phone: phone || undefined });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'MEMBER_EMAIL_DUPLICATED') {
        setError('email', { message: e.message }, { shouldFocus: true });
      } else {
        setServerError(
          e instanceof ApiError ? e.message : '가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
      return;
    }
    try {
      await login(email, password);
    } catch {
      // 가입은 됐으므로 로그인 화면에서 다시 시도하게 한다 (요청 제한 등)
      router.replace('/login');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">회원가입</CardTitle>
        <CardDescription>가입하면 내 문의 내역을 한곳에서 확인할 수 있어요.</CardDescription>
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
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldDescription>8~64자</FieldDescription>
              <FieldError errors={[errors.password]} />
            </Field>
            <Field data-invalid={!!errors.passwordConfirm}>
              <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
              <Input
                id="passwordConfirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.passwordConfirm}
                {...register('passwordConfirm')}
              />
              <FieldError errors={[errors.passwordConfirm]} />
            </Field>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">이름</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">연락처 (선택)</FieldLabel>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="010-0000-0000"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '가입 중…' : '가입하기'}
            </Button>
          </FieldGroup>
        </form>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
