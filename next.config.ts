// @owner BSJ
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // REST는 프론트 도메인을 거쳐 백엔드로 프록시 → Refresh 쿠키를 1st-party로 유지 (docs/02 §2.1)
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.BACKEND_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
