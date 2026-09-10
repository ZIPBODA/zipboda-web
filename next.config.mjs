/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 실행 중 dev 서버(.next)와 충돌 없이 빌드 검증하려면 BUILD_DIST_DIR로 출력 디렉터리를 분리한다
  ...(process.env.BUILD_DIST_DIR ? { distDir: process.env.BUILD_DIST_DIR } : {}),
  // 공유 패키지(ESM/TS)를 Next가 트랜스파일
  transpilePackages: ["@zipboda/ui", "@zipboda/ui-core"],
  // OpenCV.js(Emscripten)는 node 내장 모듈을 조건부 참조하므로 브라우저 번들에서 비워둔다
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    return config;
  }
};

export default nextConfig;
