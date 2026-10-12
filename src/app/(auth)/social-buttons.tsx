// @owner BSJ
import { Button } from '@/components/ui/button';

const PROVIDERS = [
  { path: 'google', label: 'Google로 계속하기' },
  { path: 'kakao', label: '카카오로 계속하기' },
];

/** 소셜 로그인 실패 시 백엔드가 /login?error=코드 로 돌려보낸다 (docs/04 §2) */
const OAUTH_ERROR: Record<string, string> = {
  AUTH_OAUTH_FAILED: '소셜 로그인에 실패했습니다. 다시 시도해 주세요.',
  AUTH_OAUTH_EMAIL_REQUIRED: '이메일 제공에 동의해야 소셜 로그인을 할 수 있습니다.',
  AUTH_OAUTH_STAFF_NOT_ALLOWED: '직원 계정은 이메일과 비밀번호로 로그인해 주세요.',
  AUTH_INACTIVE_MEMBER: '비활성화된 계정입니다. 관리자에게 문의해 주세요.',
};

/** 모르는 코드는 무시한다 — 주소창의 임의 문자열이 화면에 그대로 나오지 않게 */
export function oauthErrorMessage(code: string | undefined): string | null {
  return (code && OAUTH_ERROR[code]) || null;
}

/**
 * 소셜 로그인 버튼 (FR-AUTH-11). 화면 이동이 필요한 흐름이라 fetch 가 아니라 링크다 —
 * 백엔드가 제공자로 보냈다가, 끝나면 Refresh 쿠키를 심고 홈으로 돌려보낸다.
 */
export function SocialButtons() {
  return (
    <div className="mt-6 space-y-2">
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" aria-hidden />
        또는
        <span className="bg-border h-px flex-1" aria-hidden />
      </div>
      {PROVIDERS.map(({ path, label }) => (
        <Button key={path} asChild variant="outline" className="w-full">
          <a href={`/api/auth/oauth2/authorize/${path}`}>{label}</a>
        </Button>
      ))}
    </div>
  );
}
