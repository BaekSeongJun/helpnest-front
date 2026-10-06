// @owner SSJ
// CSV 다운로드 버튼 (FR-RPT-02). 대시보드·월간 리포트 공용
'use client';

import { useMutation } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CsvButton({ onDownload }: { onDownload: () => Promise<void> }) {
  const mutation = useMutation({
    mutationFn: onDownload,
    onError: (e) => toast.error(e.message || 'CSV 다운로드에 실패했습니다.'),
  });

  return (
    <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      CSV
    </Button>
  );
}
