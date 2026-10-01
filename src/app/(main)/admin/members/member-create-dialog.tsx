// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ApiError } from '@/lib/api/client';
import { createAdminMember, memberKeys } from '@/lib/api/member';

// 백엔드 AdminMemberCreateRequest 와 같은 규칙
const schema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다').max(100, '이메일은 100자 이하로 입력해 주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 8~64자로 입력해 주세요')
    .max(64, '비밀번호는 8~64자로 입력해 주세요'),
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해 주세요')
    .max(50, '이름은 50자 이하로 입력해 주세요'),
  phone: z.string().regex(/^[0-9-]{0,20}$/, '연락처는 숫자와 - 만 20자 이하로 입력해 주세요'),
  role: z.enum(['AGENT', 'LEAD']),
});

type MemberCreateValues = z.infer<typeof schema>;

/** 상담원·팀장 계정 생성 (AD-01). 초기 비밀번호는 관리자가 정해 전달한다 */
export function MemberCreateDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MemberCreateValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '', phone: '', role: 'AGENT' },
  });

  async function onSubmit({ phone, ...values }: MemberCreateValues) {
    try {
      await createAdminMember({ ...values, phone: phone || undefined });
      toast.success(`${values.name} 계정을 만들었습니다`);
      await queryClient.invalidateQueries({ queryKey: memberKeys.all });
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'MEMBER_EMAIL_DUPLICATED') {
        setError('email', { message: e.message }, { shouldFocus: true });
      } else {
        toast.error(e instanceof ApiError ? e.message : '계정을 만들지 못했습니다');
      }
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>계정 생성</DialogTitle>
          <DialogDescription>초기 비밀번호는 본인에게 따로 전달해 주세요.</DialogDescription>
        </DialogHeader>
        <form id="member-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>역할</FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem id="role-agent" value="AGENT" />
                      <FieldLabel htmlFor="role-agent">상담원</FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem id="role-lead" value="LEAD" />
                      <FieldLabel htmlFor="role-lead">팀장</FieldLabel>
                    </Field>
                  </RadioGroup>
                )}
              />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="member-email">이메일</FieldLabel>
              <Input
                id="member-email"
                type="email"
                autoComplete="off"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="member-password">초기 비밀번호</FieldLabel>
              <Input
                id="member-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldDescription>8~64자</FieldDescription>
              <FieldError errors={[errors.password]} />
            </Field>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="member-name">이름</FieldLabel>
              <Input id="member-name" aria-invalid={!!errors.name} {...register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="member-phone">연락처 (선택)</FieldLabel>
              <Input
                id="member-phone"
                type="tel"
                placeholder="010-0000-0000"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" form="member-form" disabled={isSubmitting}>
            {isSubmitting ? '만드는 중…' : '만들기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
