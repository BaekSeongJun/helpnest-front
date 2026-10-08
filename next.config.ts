// @owner BSJ
import type { NextConfig } from 'next';

// 로컬 기본값. 배포(Amplify)는 환경변수로 지정 — 없으면 "undefined/api" 가 되어 빌드가 실패했음
const backendOrigin = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080';

// 넷 다 빌드 결과물에 고정된다 → Amplify 는 "빌드" 환경변수로 넣어야 한다 (docs/02 §7).
// 빠지면 에러 없이 localhost 프록시·업로드 크기 제한·STOMP 연결 실패가 나므로 빌드 로그에 알린다.
// CI 빌드는 값 없이 돌기 때문에 실패시키지 않고 경고만 한다
const BUILD_ENV_KEYS = ['BACKEND_ORIGIN', 'NEXT_PUBLIC_UPLOAD_BASE_URL', 'NEXT_PUBLIC_WS_URL', 'PROXY_SECRET'];
const missingEnv = BUILD_ENV_KEYS.filter((key) => !process.env[key]);
// next build 가 설정을 여러 번 읽어 플래그로 한 번만 찍는다(자식 프로세스도 환경변수를 물려받음)
if (
  process.env.NODE_ENV === 'production' &&
  missingEnv.length > 0 &&
  !process.env.HELPNEST_ENV_WARNED
) {
  process.env.HELPNEST_ENV_WARNED = '1';
  console.warn(`[배포 확인] 빌드 환경변수 없음: ${missingEnv.join(', ')} (docs/02 §7)`);
}

const nextConfig: NextConfig = {
  // proxy.ts 전용 비밀값 — 서버 코드(proxy)에서만 참조한다. 클라이언트 컴포넌트에서 쓰면 번들에 노출되니 금지 (back #105)
  env: { PROXY_SECRET: process.env.PROXY_SECRET ?? '' },
  // REST는 프론트 도메인을 거쳐 백엔드로 프록시 → Refresh 쿠키를 1st-party로 유지 (docs/02 §2.1)
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendOrigin}/api/:path*` }];
  },
};

export default nextConfig;
