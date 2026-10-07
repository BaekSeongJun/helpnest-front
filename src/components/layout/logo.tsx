// @owner BSJ
// HelpNest 로고 (마크 + 워드마크). 마크는 currentColor 라서 primary 토큰이 바뀌면 같이 바뀐다.
// 메일·파비콘처럼 CSS 를 못 쓰는 곳은 고정 색 사본(public/logo.svg, app/icon.svg)을 쓴다.
import { cn } from '@/lib/utils';

/** 말풍선 안에 점 셋 — "문의를 받는다"를 단순하게 표현한 임시 마크 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M11 8h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-4.5L12 24v-4h-1a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z"
        className="fill-primary-foreground"
      />
      <circle cx="12.5" cy="14" r="1.4" fill="currentColor" />
      <circle cx="16" cy="14" r="1.4" fill="currentColor" />
      <circle cx="19.5" cy="14" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** className 으로 글자 크기를 정한다(마크는 글자 높이에 맞춰 커진다). 링크는 호출하는 쪽에서 감싼다 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold tracking-tight', className)}>
      <LogoMark className="text-primary size-[1.4em] shrink-0" />
      <span className="text-foreground">HelpNest</span>
    </span>
  );
}
