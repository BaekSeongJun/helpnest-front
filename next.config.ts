// @owner BSJ
import type { NextConfig } from 'next';

// 로컬 기본값. 배포(Amplify)는 환경변수로 지정 — 없으면 "undefined/api" 가 되어 빌드가 실패했음
const backendOrigin = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  // REST는 프론트 도메인을 거쳐 백엔드로 프록시 → Refresh 쿠키를 1st-party로 유지 (docs/02 §2.1)
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendOrigin}/api/:path*` }];
  },
};

export default nextConfig;
