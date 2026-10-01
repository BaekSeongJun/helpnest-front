// @owner PMJ
// 상담원 답변·내부 메모 입력기 (09 §2.3 CS-02). 고객 추가 답글(CU-07)은 allowInternal={false} 로 쓴다.
// 템플릿(백성준 S2)·AI 초안(신수진 S2) 버튼은 toolbarSlot 으로 주입한다 — 이 파일을 다시 고칠 필요가 없게.
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useEffect, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { REPLY_MAX_LENGTH, type ReplyValues, replySchema } from './schema';

interface ReplyEditorProps {
  /** 제출 처리. reject 는 그대로 전파된다 — 서버 에러 토스트는 호출자가 띄운다 */
  onSubmit: (values: ReplyValues) => Promise<void>;
  /** 호출자 쪽 mutation 진행 상태. 폼 자체의 제출 중 상태와 OR 로 합쳐진다 */
  submitting?: boolean;
  /** 내부 메모 토글 노출. 기본 true, 고객 화면은 false */
  allowInternal?: boolean;
  /** [템플릿] [AI 초안] 버튼 자리 */
  toolbarSlot?: ReactNode;
  /** AI 초안 삽입용 */
  initialContent?: string;
  className?: string;
}

export function ReplyEditor({
  onSubmit,
  submitting = false,
  allowInternal = true,
  toolbarSlot,
  initialContent,
  className,
}: ReplyEditorProps) {
  const contentId = useId();
  const internalId = useId();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: initialContent ?? '', isInternal: false },
  });

  // watch() 가 아니라 useWatch — watch 가 돌려주는 함수는 메모이즈가 안 돼 React Compiler 가 이 컴포넌트를 통째로 건너뛴다
  const content = useWatch({ control, name: 'content' });
  const isInternal = useWatch({ control, name: 'isInternal' });
  const busy = submitting || isSubmitting;

  // AI 초안이 나중에 도착해도 채워 넣되, 사용자가 이미 쓴 내용은 덮어쓰지 않는다
  useEffect(() => {
    if (initialContent && !getValues('content')) setValue('content', initialContent);
  }, [initialContent, getValues, setValue]);

  async function submit(values: ReplyValues) {
    await onSubmit(values);
    // 성공했을 때만 비운다. 실패하면 입력이 남아 있어야 다시 보낼 수 있다
    reset({ content: '', isInternal: values.isInternal });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className={className}>
      <FieldGroup>
        <Field data-invalid={!!errors.content}>
          <FieldLabel htmlFor={contentId}>{isInternal ? '내부 메모' : '답변'}</FieldLabel>
          <Textarea
            id={contentId}
            rows={6}
            aria-invalid={!!errors.content}
            placeholder={
              isInternal ? '팀에만 보이는 메모입니다' : '고객에게 보낼 답변을 입력해 주세요'
            }
            {...register('content')}
          />
          <div className="flex items-start justify-between gap-2">
            <FieldError errors={[errors.content]} />
            <span
              className={cn(
                'text-muted-foreground ml-auto shrink-0 text-xs tabular-nums',
                content.length > REPLY_MAX_LENGTH && 'text-destructive',
              )}
            >
              {formatNumber(content.length)}/{formatNumber(REPLY_MAX_LENGTH)}
            </span>
          </div>
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">{toolbarSlot}</div>
          <div className="flex items-center gap-3">
            {allowInternal && (
              <div className="flex items-center gap-2">
                <Switch
                  id={internalId}
                  checked={isInternal}
                  onCheckedChange={(checked) => setValue('isInternal', checked)}
                />
                <Label htmlFor={internalId} className="font-normal">
                  내부 메모
                </Label>
              </div>
            )}
            {/* 버튼 글자가 토글을 따라 바뀐다 — 내부 메모를 고객에게 오발송하지 않게 */}
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isInternal ? '내부 메모 저장' : '답변 등록'}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}
