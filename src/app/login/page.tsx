import type { Metadata } from "next";
import { AuthBrandLogo, AuthCard, LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "로그인 | 집보다",
  description: "집보다 계정으로 로그인하고 청약·평면도·가구를 한곳에서 이용하세요"
};

// figma 135:8991(PC) / 419:11102(Mobile) 로그인(AUTH-01). 모바일은 텍스트 헤더 대신 브랜드 로고(419:11103)만
export default function LoginPage() {
  return (
    <AuthCard title="로그인" description="집보다에 오신 것을 환영합니다!" mobileHeader={<AuthBrandLogo />} hideTitleOnMobile>
      <LoginForm />
    </AuthCard>
  );
}
