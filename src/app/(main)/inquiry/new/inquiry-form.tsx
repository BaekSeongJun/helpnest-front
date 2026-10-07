// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FileUploader } from '@/components/common/file-uploader';
import { FaqSuggest } from '@/components/faq/faq-suggest';
import { PageHeader } from '@/components/common/page-header';
import { LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORY_LABEL } from '@/config/badge';
import { uploadAttachments } from '@/lib/api/attachment';
import { ApiError } from '@/lib/api/client';
import { createTicket } from '@/lib/api/ticket';
import { useAuth } from '@/lib/auth/use-auth';
import type { TicketCategory } from '@/types/ticket';
import { CONTENT_MAX, guestInquirySchema, type InquiryValues, memberInquirySchema } from './schema';

/** 문의하기 (CU-03). 회원·비회원 공용 — 비회원이면 이름·이메일·조회 비밀번호를 함께 받는다 */
export function InquiryForm() {
  const { status } = useAuth();

  return (
    <div>
      <PageHeader
        title="문의하기"
        description={
          <>
            먼저{' '}
            <Link href="/faq" className="text-primary underline-offset-4 hover:underline">
              자주 묻는 질문
            </Link>
            에서 답을 찾아보세요.
          </>
        }
      />
      {/* 세션 복원이 끝나야 회원/비회원을 알 수 있다. 상태별로 폼을 새로 만들어 검증 규칙을 고정 */}
      {status === 'loading' ? (
        <LoadingSkeleton variant="detail" />
      ) : (
        <InquiryFormBody key={status} isGuest={status === 'anonymous'} />
      )}
    </div>
  );
}

function InquiryFormBody({ isGuest }: { isGuest: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryValues>({
    resolver: zodResolver(isGuest ? guestInquirySchema : memberInquirySchema),
    defaultValues: { title: '', content: '', guestName: '', guestEmail: '', guestPassword: '' },
  });
  const contentLength = useWatch({ control, name: 'content' })?.length ?? 0;
  const title = useWatch({ control, name: 'title' }) ?? '';

  async function onSubmit(values: InquiryValues) {
    setServerError(null);
    try {
      const attachmentIds = files.length
        ? (await uploadAttachments(files)).map((a) => a.attachmentId)
        : undefined;
      const res = await createTicket({
        title: values.title,
        content: values.content,
        categoryHint: values.categoryHint,
        attachmentIds,
        guest: isGuest
          ? { name: values.guestName!, email: values.guestEmail!, password: values.guestPassword! }
          : undefined,
      });
      const query = new URLSearchParams({ ticketNo: res.ticketNo });
      if (isGuest) query.set('guest', '1');
      router.push(`/inquiry/complete?${query}`);
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : '접수하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {isGuest && (
              <FieldSet>
                {/* 시안 A안: 회원/비회원 전환 + 비회원 정보를 맨 위에 */}
                <FieldLegend variant="label">문의하는 분</FieldLegend>
                <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1 text-sm">
                  <Link
                    href="/login?next=/inquiry/new"
                    className="text-muted-foreground hover:text-foreground rounded-md py-1.5 text-center"
                  >
                    회원으로 문의
                  </Link>
                  <span
                    aria-current="true"
                    className="bg-background rounded-md py-1.5 text-center font-medium shadow-xs"
                  >
                    비회원으로 문의
                  </span>
                </div>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.guestName}>
                    <FieldLabel htmlFor="guest-name">이름</FieldLabel>
                    <Input
                      id="guest-name"
                      autoComplete="name"
                      aria-invalid={!!errors.guestName}
                      {...register('guestName')}
                    />
                    <FieldError errors={[errors.guestName]} />
                  </Field>
                  <Field data-invalid={!!errors.guestEmail}>
                    <FieldLabel htmlFor="guest-email">이메일</FieldLabel>
                    <Input
                      id="guest-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={!!errors.guestEmail}
                      {...register('guestEmail')}
                    />
                    <FieldDescription>답변을 이 주소로 알려 드려요.</FieldDescription>
                    <FieldError errors={[errors.guestEmail]} />
                  </Field>
                  <Field data-invalid={!!errors.guestPassword} className="sm:col-span-2">
                    <FieldLabel htmlFor="guest-password">조회 비밀번호</FieldLabel>
                    <Input
                      id="guest-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={!!errors.guestPassword}
                      {...register('guestPassword')}
                    />
                    <FieldDescription>
                      4~64자. 티켓번호·이메일과 함께 문의 내역을 볼 때 필요해요.
                    </FieldDescription>
                    <FieldError errors={[errors.guestPassword]} />
                  </Field>
                </FieldGroup>
              </FieldSet>
            )}

            <Field>
              <FieldLabel htmlFor="inquiry-category">
                문의 유형 <span className="text-muted-foreground font-normal">(선택)</span>
              </FieldLabel>
              <Controller
                control={control}
                name="categoryHint"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v as TicketCategory)}
                  >
                    <SelectTrigger id="inquiry-category" className="w-full">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>고르지 않아도 내용을 보고 자동으로 분류해요.</FieldDescription>
            </Field>

            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="inquiry-title">제목</FieldLabel>
              <Input id="inquiry-title" aria-invalid={!!errors.title} {...register('title')} />
              <FieldError errors={[errors.title]} />
            </Field>
            <FaqSuggest title={title} />

            <Field data-invalid={!!errors.content}>
              <FieldLabel htmlFor="inquiry-content">내용</FieldLabel>
              <Textarea
                id="inquiry-content"
                rows={6}
                maxLength={CONTENT_MAX}
                placeholder="주문번호, 상품명, 겪고 있는 문제를 자세히 적어 주시면 더 빨리 도와드릴 수 있어요."
                aria-invalid={!!errors.content}
                {...register('content')}
              />
              <FieldDescription className="text-right tabular-nums">
                {contentLength.toLocaleString()} / {CONTENT_MAX.toLocaleString()}
              </FieldDescription>
              <FieldError errors={[errors.content]} />
            </Field>

            <Field>
              <FieldLabel>
                첨부 파일 <span className="text-muted-foreground font-normal">(선택)</span>
              </FieldLabel>
              <FileUploader files={files} onChange={setFiles} disabled={isSubmitting} />
            </Field>

            {serverError && <FieldError>{serverError}</FieldError>}
            <div className="flex justify-end pt-1">
              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? '접수 중…' : '문의 접수하기'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
