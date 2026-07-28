/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 공유 패키지(ESM/TS)를 Next가 트랜스파일
  transpilePackages: ["@zipboda/ui", "@zipboda/ui-core"]
};

export default nextConfig;
