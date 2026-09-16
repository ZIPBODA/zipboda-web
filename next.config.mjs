/** next/constants의 같은 이름 상수값. ESM 설정 파일에서는 next 서브경로를 import할 수 없다(exports 맵 없음) */
const PHASE_DEVELOPMENT_SERVER = "phase-development-server";

const PAGE_EXTENSIONS = ["tsx", "ts", "jsx", "js"];
/**
 * 개발 전용 화면은 `page.dev.tsx`로 둔다.
 * 운영 빌드에서는 이 확장자를 페이지로 인정하지 않아 라우트도 번들도 생기지 않는다 —
 * 내부 도구(도면 트레이싱 등)는 로그인 검사가 없어 배포되면 주소만 알면 누구나 열 수 있다.
 */
const DEV_PAGE_EXTENSIONS = ["dev.tsx"];

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

export default (phase) => ({
  ...nextConfig,
  pageExtensions: phase === PHASE_DEVELOPMENT_SERVER ? [...PAGE_EXTENSIONS, ...DEV_PAGE_EXTENSIONS] : PAGE_EXTENSIONS
});
