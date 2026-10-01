// @owner BSJ
'use client';

import { Loader2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  /** 삭제처럼 되돌릴 수 없는 동작이면 빨간 버튼 */
  destructive?: boolean;
  /**
   * Promise 를 돌려주면 끝날 때까지 버튼을 잠그고, 성공해야 닫는다.
   * 실패하면 열린 채로 두므로 호출 쪽에서 토스트로 에러를 알린다 (08 §7)
   */
  onConfirm: () => void | Promise<void>;
  /** 여는 버튼. 없으면 open/onOpenChange 로 직접 제어 */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** 위험 동작 확인 (삭제, 해결 처리, 재배정, 채팅 종료 — 08 §7) */
export function ConfirmDialog({
  title,
  description,
  confirmText = '확인',
  destructive,
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isOpen = open ?? innerOpen;

  function setOpen(next: boolean) {
    if (pending) return;
    setInnerOpen(next);
    onOpenChange?.(next);
  }

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault(); // 기본 동작(즉시 닫힘) 대신 결과를 보고 닫는다
    setPending(true);
    try {
      await onConfirm();
      setPending(false);
      setInnerOpen(false);
      onOpenChange?.(false);
    } catch {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>취소</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
