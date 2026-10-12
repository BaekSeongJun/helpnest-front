// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NewPasswordForm } from '@/components/auth/new-password-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { requestGuestPasswordReset, resetGuestPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

// 조회 폼(lookup-form)과 같은 규칙 — 형식은 길이만 본다
const requestSchema = z.object({
  ticketNo: z
    .string()
    .trim()
    .min(1, '티켓번호를 입력해 주세요')
    .max(30, '티켓번호가 올바르지 않습니다'),
  email: z.string().trim().min(1, '이메일을 입력해 주세요').max(100),
});

export function GuestReset({ token }: { token: string }) {
  return (
    <div className="mx-auto max-w-md">
      {token ? <NewPassword token={token} /> : <RequestMail />}
    </div>
  );
}

/** ① 티켓번호·이메일 → 맞든 아니든 같은 안내 (FR-AUTH-09, 열거 방지) */
function RequestMail() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { ticketNo: '', email: '' },
  });

  async function onSubmit({ ticketNo, email }: z.infer<typeof requestSchema>) {
    setServerError(null);
    try {
      await requestGuestPasswordReset(ticketNo, email);
      setSent(true);
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : '요청하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  if (sent) {
    return (
      <ResultCard
        icon={<MailCheck className="text-primary size-10" aria-hidden />}
        title="메일을 확인해 주세요"
      >
        티켓번호와 이메일이 맞으면 조회 비밀번호 재설정 링크를 보냈어요. 링크는 30분 동안 한 번만 쓸
        수 있어요.
      </ResultCard>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">조회 비밀번호 재설정</CardTitle>
        <CardDescription>접수할 때 입력한 이메일로 재설정 링크를 보내 드려요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.ticketNo}>
              <FieldLabel htmlFor="reset-ticket-no">티켓번호</FieldLabel>
              <Input
                id="reset-ticket-no"
                placeholder="HN-20261002-000123"
                autoComplete="off"
                aria-invalid={!!errors.ticketNo}
                {...register('ticketNo')}
              />
              <FieldError errors={[errors.ticketNo]} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="reset-email">이메일</FieldLabel>
              <Input
                id="reset-email"
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
        <BackToLookup />
      </CardContent>
    </Card>
  );
}

/** ② 메일 링크로 들어와 새 조회 비밀번호 (4~64자, 접수 때와 같은 규칙) */
function NewPassword({ token }: { token: string }) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <ResultCard
        icon={<CircleCheck className="text-success size-10" aria-hidden />}
        title="조회 비밀번호를 바꿨어요"
        action={
          <Button asChild className="mt-2 w-full">
            <Link href="/inquiry/lookup">문의 조회하기</Link>
          </Button>
        }
      >
        새 조회 비밀번호로 문의를 확인해 주세요.
      </ResultCard>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">새 조회 비밀번호</CardTitle>
        <CardDescription>문의 내역을 볼 때 쓸 비밀번호를 입력해 주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <NewPasswordForm
          minLength={4}
          label="새 조회 비밀번호"
          submitLabel="조회 비밀번호 변경"
          onSubmit={async (password) => {
            await resetGuestPassword(token, password);
            setDone(true);
          }}
        />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          링크가 만료됐나요?{' '}
          <Link href="/inquiry/lookup/reset" className="text-primary hover:underline">
            다시 받기
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function ResultCard({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 text-center">
        {icon}
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{children}</p>
        {action ?? <BackToLookup />}
      </CardContent>
    </Card>
  );
}

function BackToLookup() {
  return (
    <p className="text-muted-foreground mt-6 text-center text-sm">
      <Link href="/inquiry/lookup" className="hover:text-foreground">
        비회원 문의 조회로 돌아가기
      </Link>
    </p>
  );
}
