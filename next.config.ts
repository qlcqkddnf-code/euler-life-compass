import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // ✅ 정적 export에서 /result/rocket 같은 경로가 안정적으로 동작하도록 디렉터리 기반 출력
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
