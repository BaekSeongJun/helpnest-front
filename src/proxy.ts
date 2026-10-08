// @owner BSJ
// 1) /api: 백엔드가 Amplify 경유 요청을 알아보도록 비밀 헤더를 붙인다 (요청 제한의 클라이언트 IP 판별, back #105)
// 2) 보호 경로 1차 확인 (Next 16 Proxy = 구 middleware). Refresh 쿠키 유무만 보고, 유효성·역할은 백엔드와 AuthGuard 가 판단
import { type NextRequest, NextResponse } from 'next/server';

// next.config.ts env 로 빌드 때 박힌다(Amplify 런타임엔 콘솔 환경변수가 없어서). 비면(로컬) 붙이지 않는다
const PROXY_SECRET = process.env.PROXY_SECRET;

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!PROXY_SECRET) return NextResponse.next();
    const headers = new Headers(request.headers);
    headers.set('x-helpnest-proxy', PROXY_SECRET); // 클라이언트가 보낸 같은 이름 헤더는 덮어쓴다
    return NextResponse.next({ request: { headers } });
  }
  if (request.cookies.has('refreshToken')) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL('/login', request.url);
  login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // /my/inquiries/[id] 는 비회원(Guest 토큰, 쿠키 없음)도 들어오므로 제외 — AuthGuard 가 처리
  matcher: ['/api/:path*', '/my/profile', '/my/inquiries', '/chat', '/console/:path*', '/admin/:path*'],
};
