// @owner PMJ
// 상담원 답변·내부 메모 입력기 (09 §2.3 CS-02). 고객 추가 답글(CU-07)은 allowInternal={false} 로 쓴다.
// 템플릿(백성준 S2)·AI 초안(신수진 S2) 버튼은 toolbarSlot 으로 주입한다 — 이 파일을 다시 고칠 필요가 없게.
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { type ReactNode, type Ref, useEffect, useId, useImperativeHandle } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { REPLY_MAX_LENGTH, type ReplyValues, replySchema } from './schema';

/** 진짜 제출 버튼을 가려내는 표식 ({@link ReplyEditor} 의 guardedSubmit) */
const SUBMIT_BUTTON_NAME = 'reply-submit';

/**
 * 툴바 버튼(템플릿·AI 초안)이 본문에 글을 넣는 통로.
 *
 * <p>`initialContent` 로는 안 된다 — 그쪽은 비어 있을 때만 채우므로 상담원이 이미 몇 글자
 * 적어 두었으면 템플릿을 골라도 아무 일이 일어나지 않고, 두 번째 템플릿도 들어가지 않는다.
 * 그렇다고 본문을 호출자가 들고 있게 바꾸면(제어 컴포넌트) 글자 수·검증·초기화가 전부
 * 밖으로 나가야 한다. 넣는 동작 하나만 밖으로 여는 것이 가장 작은 변경이다.
 */
export interface ReplyEditorHandle {
  /** 커서 위치가 아니라 끝에 덧붙인다 — 템플릿·초안은 문단 단위라 중간 삽입이 의미가 없다 */
  insertText: (text: string) => void;
}

interface ReplyEditorProps {
  /** 제출 처리. reject 는 그대로 전파된다 — 서버 에러 토스트는 호출자가 띄운다 */
  onSubmit: (values: ReplyValues) => Promise<void>;
  /** 툴바 버튼이 본문에 글을 넣을 때 쓴다 ({@link ReplyEditorHandle}) */
  ref?: Ref<ReplyEditorHandle>;
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
  ref,
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

  // 덮어쓰지 않고 뒤에 붙인다. 템플릿을 고른 뒤 초안을 더 넣는 순서도 그대로 쌓인다.
  // shouldValidate 로 "내용을 입력해 주세요" 가 바로 사라지게 한다 — 글이 들어왔는데
  // 에러 문구가 남아 있으면 상담원이 등록 버튼을 누르기 전까지 고쳐야 할 것으로 읽는다
  useImperativeHandle(ref, () => ({
    insertText(text: string) {
      const current = getValues('content');
      setValue('content', current ? `${current}\n\n${text}` : text, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
  }));

  /**
   * <b>제출 버튼이 누른 제출만 받는다.</b>
   *
   * <p>`toolbarSlot` 에 들어오는 버튼은 남의 컴포넌트다(TemplatePicker·AiDraftButton). HTML 에서
   * form 안의 버튼은 `type` 을 적지 않으면 기본이 `submit` 이고 shadcn `Button` 도 type 을 넣지
   * 않으므로, 그 버튼을 누르는 순간 <b>쓰다 만 답변이 고객에게 등록된다</b> — 실제로 [AI 초안]
   * 을 누를 때마다 공개 답변이 나갔다. 남이 소유한 파일에 `type="button"` 을 요구하는 대신
   * 슬롯을 연 쪽에서 막는다. 슬롯에 어떤 버튼이 들어와도 안전해야 한다.
   */
  function guardedSubmit(event: React.FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name !== SUBMIT_BUTTON_NAME) {
      event.preventDefault();
      return;
    }
    void handleSubmit(submit)(event);
  }

  async function submit(values: ReplyValues) {
    await onSubmit(values);
    // 성공했을 때만 비운다. 실패하면 입력이 남아 있어야 다시 보낼 수 있다
    reset({ content: '', isInternal: values.isInternal });
  }

  return (
    <form onSubmit={guardedSubmit} noValidate className={className}>
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
            <Button type="submit" name={SUBMIT_BUTTON_NAME} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isInternal ? '내부 메모 저장' : '답변 등록'}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}
