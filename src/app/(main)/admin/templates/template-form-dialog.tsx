// @owner BSJ
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import {
  createTemplate,
  TEMPLATE_VARIABLES,
  templateKeys,
  updateTemplate,
} from '@/lib/api/template';
import type { Template } from '@/types/template';
import type { TicketCategory } from '@/types/ticket';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as [TicketCategory, ...TicketCategory[]];

// 백엔드 TemplateRequest 와 같은 규칙
const schema = z.object({
  category: z.enum(CATEGORIES, { error: '유형을 선택해 주세요' }),
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해 주세요')
    .max(100, '제목은 100자 이하로 입력해 주세요'),
  content: z
    .string()
    .trim()
    .min(1, '본문을 입력해 주세요')
    .max(5000, '본문은 5,000자 이하로 입력해 주세요'),
  active: z.boolean(),
});

type TemplateFormValues = z.infer<typeof schema>;

interface TemplateFormDialogProps {
  /** null 이면 새로 작성 */
  template: Template | null;
  onClose: () => void;
}

/** 템플릿 작성·수정 다이얼로그. 치환 변수 버튼을 누르면 커서 위치에 넣는다 */
export function TemplateFormDialog({ template, onClose }: TemplateFormDialogProps) {
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    // 새로 작성할 때 category 는 비워 두고 선택하게 한다
    defaultValues: template
      ? {
          category: template.category,
          title: template.title,
          content: template.content,
          active: template.active,
        }
      : { title: '', content: '', active: true },
  });
  const { ref: contentFieldRef, ...contentField } = register('content');

  function insertVariable(variable: string) {
    const el = contentRef.current;
    const value = getValues('content');
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setValue('content', value.slice(0, start) + variable + value.slice(end), {
      shouldDirty: true,
    });
    // 값이 바뀐 뒤 커서를 변수 뒤로
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + variable.length, start + variable.length);
    });
  }

  async function onSubmit(values: TemplateFormValues) {
    try {
      if (template) await updateTemplate(template.templateId, values);
      else await createTemplate(values);
      toast.success(template ? '템플릿을 수정했습니다' : '템플릿을 등록했습니다');
      await queryClient.invalidateQueries({ queryKey: templateKeys.all });
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : '저장에 실패했습니다');
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{template ? '템플릿 수정' : '템플릿 작성'}</DialogTitle>
        </DialogHeader>
        <form id="template-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.category}>
              <FieldLabel htmlFor="template-category">유형</FieldLabel>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  // 새로 작성할 땐 undefined → '' 로 넘겨 처음부터 controlled (빈 값이면 placeholder)
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id="template-category" aria-invalid={!!errors.category}>
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
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="template-title">제목</FieldLabel>
              <Input id="template-title" aria-invalid={!!errors.title} {...register('title')} />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={!!errors.content}>
              <FieldLabel htmlFor="template-content">본문</FieldLabel>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-muted-foreground text-xs">치환 변수:</span>
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => insertVariable(v)}
                  >
                    {v}
                  </Button>
                ))}
              </div>
              <Textarea
                id="template-content"
                rows={10}
                aria-invalid={!!errors.content}
                {...contentField}
                ref={(el) => {
                  contentFieldRef(el);
                  contentRef.current = el;
                }}
              />
              <FieldDescription>
                삽입할 때 {'{고객명}'}은 고객 이름, {'{티켓번호}'}는 해당 티켓번호로 바뀝니다.
              </FieldDescription>
              <FieldError errors={[errors.content]} />
            </Field>
            <Field orientation="horizontal">
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Switch
                    id="template-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldLabel htmlFor="template-active">상담원에게 보이기</FieldLabel>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" form="template-form" disabled={isSubmitting}>
            {isSubmitting ? '저장 중…' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
