import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // ✅ 정적 export에서 /result/rocket 같은 경로가 안정적으로 동작하도록 디렉터리 기반 출력
  trailingSlash: true,
  // ✅ 정적 자산이 항상 “루트(/)” 기준으로 로드되도록 강제 (Vercel 루트 배포 기준)
  // (서브패스 배포가 아니라면 빈 문자열이 정석이며, 잘못된 assetPrefix로 인한 CSS/JS 404를 방지)
  assetPrefix: '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
