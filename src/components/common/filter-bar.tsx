// @owner BSJ
'use client';

import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  children: ReactNode;
  onReset: () => void;
}

/** 목록 상단 필터 영역. children 에 Select·Input 등을 그대로 넣는다 */
export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <div className="bg-card mb-4 flex flex-wrap items-end gap-2 rounded-lg border p-3">
      {children}
      <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto">
        <RotateCcw className="size-4" />
        초기화
      </Button>
    </div>
  );
}
