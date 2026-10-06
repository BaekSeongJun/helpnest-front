// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/client';

interface NewPasswordFormProps {
  /** 회원 8자(CM-04), 비회원 조회 비밀번호 4자(CU-06) — 백엔드 규칙과 같게 */
  minLength: number;
  label?: string;
  submitLabel?: string;
  /** 실패하면 ApiError 를 던진다 — 메시지를 폼 아래에 보여준다 */
  onSubmit: (password: string) => Promise<void>;
}

/** 새 비밀번호 + 확인. 회원 재설정(CM-04)·비회원 조회 비밀번호 재설정(CU-06) 공용 */
export function NewPasswordForm({
  minLength,
  label = '새 비밀번호',
  submitLabel = '변경',
  onSubmit,
}: NewPasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const lengthMessage = `비밀번호는 ${minLength}~64자로 입력해 주세요`;
  const schema = z
    .object({
      password: z.string().min(minLength, lengthMessage).max(64, lengthMessage),
      passwordConfirm: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요'),
    })
    .refine((v) => v.password === v.passwordConfirm, {
      message: '비밀번호가 일치하지 않습니다',
      path: ['passwordConfirm'],
    });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function submit({ password }: z.infer<typeof schema>) {
    setServerError(null);
    try {
      await onSubmit(password);
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : '변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="new-password">{label}</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldDescription>{minLength}~64자</FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.passwordConfirm}>
          <FieldLabel htmlFor="new-password-confirm">{label} 확인</FieldLabel>
          <Input
            id="new-password-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.passwordConfirm}
            {...register('passwordConfirm')}
          />
          <FieldError errors={[errors.passwordConfirm]} />
        </Field>
        {serverError && <FieldError>{serverError}</FieldError>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? '변경 중…' : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
