// @owner BSJ
// 보호 경로 1차 확인 (Next 16 Proxy = 구 middleware). Refresh 쿠키 유무만 보고, 유효성·역할은 백엔드와 AuthGuard 가 판단
import { type NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.cookies.has('refreshToken')) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL('/login', request.url);
  login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // /my/inquiries/[id] 는 비회원(Guest 토큰, 쿠키 없음)도 들어오므로 제외 — AuthGuard 가 처리
  matcher: ['/my/profile', '/my/inquiries', '/chat', '/console/:path*', '/admin/:path*'],
};
