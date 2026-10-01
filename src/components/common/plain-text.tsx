// @owner BSJ
// 사용자 입력 본문 출력 (04: 서버는 원문 저장, 프론트는 이스케이프 출력)
// React 텍스트 노드로만 그리므로 HTML 이 실행되지 않는다. dangerouslySetInnerHTML 금지

import { cn } from '@/lib/utils';

// 끝의 문장부호(. , ) 등)는 링크에서 뺀다: "https://a.com/x." → 링크는 https://a.com/x
const URL_PATTERN = /(https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]])/g;

/** 텍스트를 [일반, URL, 일반, URL, ...] 로 나눈다 (split + 캡처 그룹 → 홀수 번째가 URL) */
export function splitUrls(text: string): string[] {
  return text.split(URL_PATTERN);
}

export function PlainText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('text-sm break-words whitespace-pre-wrap', className)}>
      {splitUrls(text).map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </div>
  );
}
