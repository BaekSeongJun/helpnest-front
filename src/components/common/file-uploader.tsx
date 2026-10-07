// @owner BSJ
'use client';

import { Upload, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { ATTACHMENT_LIMIT } from '@/lib/api/attachment';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** 선택한 파일 중 걸러진 사유. 통과한 파일만 남긴다 */
function validate(current: File[], added: File[]): { files: File[]; error: string | null } {
  const errors: string[] = [];
  const accepted = [...current];
  for (const file of added) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!(ATTACHMENT_LIMIT.extensions as readonly string[]).includes(ext)) {
      errors.push(`${file.name}: 올릴 수 없는 파일 형식입니다`);
    } else if (file.size > ATTACHMENT_LIMIT.maxBytes) {
      errors.push(`${file.name}: 10MB 이하만 올릴 수 있습니다`);
    } else if (accepted.length >= ATTACHMENT_LIMIT.maxFiles) {
      errors.push(`첨부는 ${ATTACHMENT_LIMIT.maxFiles}개까지 올릴 수 있습니다`);
      break;
    } else {
      accepted.push(file);
    }
  }
  return { files: accepted, error: errors.length ? errors.join('\n') : null };
}

/**
 * 첨부 선택 + 목록 (≤5개, 각 ≤10MB, 허용 확장자). 업로드는 하지 않는다 —
 * 제출할 때 호출 쪽이 uploadAttachments(files) 로 한 번에 보낸다
 */
export function FileUploader({ files, onChange, disabled }: FileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const full = files.length >= ATTACHMENT_LIMIT.maxFiles;

  function handleSelect(selected: FileList | null) {
    if (!selected?.length) return;
    const result = validate(files, Array.from(selected));
    setError(result.error);
    onChange(result.files);
    // 같은 파일을 지웠다가 다시 고를 수 있게 비운다
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        className="sr-only"
        accept={ATTACHMENT_LIMIT.extensions.map((e) => `.${e}`).join(',')}
        disabled={disabled}
        onChange={(e) => handleSelect(e.target.files)}
      />
      {/* 시안 A안: 점선 영역을 누르거나 파일을 끌어 놓는다 */}
      <button
        type="button"
        disabled={disabled || full}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && !full) handleSelect(e.dataTransfer.files);
        }}
        className={cn(
          'text-muted-foreground focus-visible:ring-ring/50 flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-60',
          dragging ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/50',
        )}
      >
        <Upload className="size-5" aria-hidden="true" />
        <span className="text-foreground text-sm">파일을 끌어 놓거나 눌러서 올려 주세요</span>
        <span className="text-xs">
          이미지·PDF·문서·한글, 최대 10MB · {files.length}/{ATTACHMENT_LIMIT.maxFiles}개
        </span>
      </button>

      {files.length > 0 && (
        <ul className="divide-y rounded-md border text-sm">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {formatBytes(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`${file.name} 삭제`}
                disabled={disabled}
                onClick={() => {
                  setError(null);
                  onChange(files.filter((_, j) => j !== i));
                }}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && <FieldError className="whitespace-pre-line">{error}</FieldError>}
    </div>
  );
}
