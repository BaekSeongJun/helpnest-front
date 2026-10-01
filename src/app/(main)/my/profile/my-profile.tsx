// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { logout } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { changePassword, updateProfile } from '@/lib/api/member';
import { useAuth } from '@/lib/auth/use-auth';
import type { Member } from '@/types/auth';

// 규칙은 백엔드 ProfileUpdateRequest·PasswordChangeRequest 와 같다 (docs/04 §2)
const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요')
    .max(50, '이름은 50자 이하로 입력해 주세요'),
  phone: z.string().regex(/^[0-9-]{0,20}$/, '연락처는 숫자와 - 만 20자 이하로 입력해 주세요'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요'),
    newPassword: z
      .string()
      .min(8, '비밀번호는 8~64자로 입력해 주세요')
      .max(64, '비밀번호는 8~64자로 입력해 주세요'),
    newPasswordConfirm: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요'),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['newPasswordConfirm'],
  });

function errorMessage(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback;
}

/** AuthGuard 안에서만 그려지므로 member 가 있다 */
export function MyProfile() {
  const { member } = useAuth();
  if (!member) return null;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="내 정보" />
      <div className="flex flex-col gap-6">
        <ProfileCard member={member} />
        <PasswordCard />
      </div>
    </div>
  );
}

function ProfileCard({ member }: { member: Member }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: member.name, phone: member.phone ?? '' },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setServerError(null);
    try {
      const saved = await updateProfile(values);
      reset({ name: saved.name, phone: saved.phone ?? '' }); // 저장된 값을 새 기준으로
      toast.success('내 정보를 저장했습니다');
    } catch (e) {
      setServerError(errorMessage(e, '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-email">이메일</FieldLabel>
              <Input id="profile-email" value={member.email} readOnly disabled />
              <FieldDescription>이메일은 바꿀 수 없어요.</FieldDescription>
            </Field>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="profile-name">이름</FieldLabel>
              <Input
                id="profile-name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="profile-phone">연락처 (선택)</FieldLabel>
              <Input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                placeholder="010-0000-0000"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="w-full sm:w-auto sm:self-end"
            >
              {isSubmitting ? '저장 중…' : '저장'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setServerError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
    } catch (e) {
      setServerError(errorMessage(e, '변경하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
      return;
    }
    // 서버가 모든 Refresh 를 폐기했다 — 쿠키·메모리 토큰을 지우고 새 비밀번호로 다시 로그인
    await logout();
    toast.success('비밀번호를 바꿨습니다. 새 비밀번호로 다시 로그인해 주세요');
    router.replace('/login');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>비밀번호 변경</CardTitle>
        <CardDescription>바꾸면 모든 기기에서 로그아웃돼요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.currentPassword}>
              <FieldLabel htmlFor="current-password">현재 비밀번호</FieldLabel>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword}
                {...register('currentPassword')}
              />
              <FieldError errors={[errors.currentPassword]} />
            </Field>
            <Field data-invalid={!!errors.newPassword}>
              <FieldLabel htmlFor="new-password">새 비밀번호</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                {...register('newPassword')}
              />
              <FieldDescription>8~64자</FieldDescription>
              <FieldError errors={[errors.newPassword]} />
            </Field>
            <Field data-invalid={!!errors.newPasswordConfirm}>
              <FieldLabel htmlFor="new-password-confirm">새 비밀번호 확인</FieldLabel>
              <Input
                id="new-password-confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.newPasswordConfirm}
                {...register('newPasswordConfirm')}
              />
              <FieldError errors={[errors.newPasswordConfirm]} />
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-end">
              {isSubmitting ? '변경 중…' : '비밀번호 변경'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
