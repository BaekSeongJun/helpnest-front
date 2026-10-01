// @owner BSJ
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/lib/api/client';
import { updateAvailability } from '@/lib/api/member';

/**
 * 상담원 상담 가능 ON/OFF (Header, AGENT 전용). OFF 면 자동 배정 대상에서 빠진다.
 * 누르는 즉시 바꿔 보여 주고, 실패하면 되돌린 뒤 토스트
 */
export function AvailabilityToggle({ available }: { available: boolean }) {
  // 요청 중에만 쓰는 낙관적 값. 평소에는 세션 회원(available prop)을 그대로 보여준다
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const checked = optimistic ?? available;

  async function handleChange(next: boolean) {
    setOptimistic(next);
    try {
      await updateAvailability(next);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : '상담 가능 상태를 바꾸지 못했습니다');
    } finally {
      setOptimistic(null);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground hidden sm:inline">
        {checked ? '상담 가능' : '상담 불가'}
      </span>
      <Switch
        checked={checked}
        disabled={optimistic !== null}
        onCheckedChange={handleChange}
        aria-label="상담 가능"
      />
    </label>
  );
}
