// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmptyState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { guestLogin } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/use-auth';

const schema = z.object({
  ticketNo: z
    .string()
    .trim()
    .min(1, '티켓번호를 입력해 주세요')
    .max(30, '티켓번호가 올바르지 않습니다'),
  email: z.string().trim().min(1, '이메일을 입력해 주세요').max(100),
  password: z.string().min(1, '조회 비밀번호를 입력해 주세요').max(64),
});

type LookupValues = z.infer<typeof schema>;

/**
 * 비회원 문의 조회 (CU-05). 성공하면 Guest 토큰(메모리)으로 상세(CU-07)로 이동.
 * 로그인 중에는 막는다 — 회원 토큰이 우선 쓰여 상세·첨부·답글 권한이 어긋나기 때문
 */
export function LookupForm() {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingSkeleton variant="detail" />;
  if (status === 'authenticated') {
    return (
      <EmptyState
        title="로그인 중에는 비회원 조회를 할 수 없어요"
        description="회원으로 남긴 문의는 내 문의에서 확인하고, 비회원 문의는 로그아웃한 뒤 조회해 주세요."
        action={
          <Button asChild>
            <Link href="/my/inquiries">내 문의</Link>
          </Button>
        }
      />
    );
  }
  return <LookupFormBody />;
}

function LookupFormBody() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LookupValues>({
    resolver: zodResolver(schema),
    defaultValues: { ticketNo: '', email: '', password: '' },
  });

  async function onSubmit(values: LookupValues) {
    setServerError(null);
    try {
      const ticketId = await guestLogin(values);
      router.push(`/my/inquiries/${ticketId}`);
    } catch (e) {
      // 실패 사유는 서버가 구분하지 않는다 (열거 방지) — 메시지 그대로
      setServerError(
        e instanceof ApiError ? e.message : '조회하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">비회원 문의 조회</CardTitle>
          <CardDescription>접수할 때 받은 티켓번호와 입력한 정보로 확인해요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.ticketNo}>
                <FieldLabel htmlFor="lookup-ticket-no">티켓번호</FieldLabel>
                <Input
                  id="lookup-ticket-no"
                  placeholder="HN-20261002-000123"
                  autoComplete="off"
                  aria-invalid={!!errors.ticketNo}
                  {...register('ticketNo')}
                />
                <FieldError errors={[errors.ticketNo]} />
              </Field>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="lookup-email">이메일</FieldLabel>
                <Input
                  id="lookup-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="lookup-password">조회 비밀번호</FieldLabel>
                <Input
                  id="lookup-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <FieldError errors={[errors.password]} />
              </Field>
              {serverError && <FieldError>{serverError}</FieldError>}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? '조회 중…' : '조회'}
              </Button>
            </FieldGroup>
          </form>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            회원이신가요?{' '}
            <Link
              href="/login?next=/my/inquiries"
              className="text-foreground underline-offset-4 hover:underline"
            >
              로그인
            </Link>
            하면 내 문의를 한곳에서 볼 수 있어요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
