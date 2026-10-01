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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORY_LABEL } from '@/config/badge';
import { ApiError } from '@/lib/api/client';
import { createFaq, faqKeys, updateFaq } from '@/lib/api/faq';
import type { Faq } from '@/types/faq';
import type { TicketCategory } from '@/types/ticket';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as [TicketCategory, ...TicketCategory[]];

// 백엔드 FaqRequest 와 같은 규칙
const schema = z.object({
  category: z.enum(CATEGORIES, { error: '유형을 선택해 주세요' }),
  question: z
    .string()
    .trim()
    .min(1, '질문을 입력해 주세요')
    .max(300, '질문은 300자 이하로 입력해 주세요'),
  answer: z
    .string()
    .trim()
    .min(1, '답변을 입력해 주세요')
    .max(5000, '답변은 5,000자 이하로 입력해 주세요'),
  published: z.boolean(),
});

type FaqFormValues = z.infer<typeof schema>;

interface FaqFormDialogProps {
  /** null 이면 새로 작성 */
  faq: Faq | null;
  onClose: () => void;
}

/** FAQ 작성·수정 다이얼로그. 저장하면 고객·관리 목록을 함께 갱신한다 */
export function FaqFormDialog({ faq, onClose }: FaqFormDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(schema),
    // 새로 작성할 때 category 는 비워 두고 선택하게 한다
    defaultValues: faq
      ? {
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          published: faq.published,
        }
      : { question: '', answer: '', published: true },
  });

  async function onSubmit(values: FaqFormValues) {
    try {
      if (faq) await updateFaq(faq.faqId, values);
      else await createFaq(values);
      toast.success(faq ? 'FAQ를 수정했습니다' : 'FAQ를 등록했습니다');
      await queryClient.invalidateQueries({ queryKey: faqKeys.all });
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : '저장에 실패했습니다');
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{faq ? 'FAQ 수정' : 'FAQ 작성'}</DialogTitle>
        </DialogHeader>
        <form id="faq-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.category}>
              <FieldLabel htmlFor="faq-category">유형</FieldLabel>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  // 새로 작성할 땐 undefined → '' 로 넘겨 처음부터 controlled (빈 값이면 placeholder)
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id="faq-category" aria-invalid={!!errors.category}>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {CATEGORY_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.category]} />
            </Field>
            <Field data-invalid={!!errors.question}>
              <FieldLabel htmlFor="faq-question">질문</FieldLabel>
              <Input id="faq-question" aria-invalid={!!errors.question} {...register('question')} />
              <FieldError errors={[errors.question]} />
            </Field>
            <Field data-invalid={!!errors.answer}>
              <FieldLabel htmlFor="faq-answer">답변</FieldLabel>
              <Textarea
                id="faq-answer"
                rows={8}
                aria-invalid={!!errors.answer}
                {...register('answer')}
              />
              <FieldError errors={[errors.answer]} />
            </Field>
            <Field orientation="horizontal">
              <Controller
                control={control}
                name="published"
                render={({ field }) => (
                  <Switch
                    id="faq-published"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldLabel htmlFor="faq-published">고객에게 공개</FieldLabel>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" form="faq-form" disabled={isSubmitting}>
            {isSubmitting ? '저장 중…' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
