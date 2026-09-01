import type { Metadata } from "next";
import { AuthCard, MobileAuthTopBar, SignupForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "회원가입 | 집보다",
  description: "집보다의 맞춤형 부동산 인테리어 서비스를 시작하세요"
};

// figma 135:9176(PC) / 419:11130(Mobile) 회원가입(AUTH-02). 모바일은 상단바(←/회원가입) + 폼 내 제목
export default function SignupPage() {
  return (
    <>
      <MobileAuthTopBar title="회원가입" />
      <AuthCard title="회원가입" description="집보다의 맞춤형 부동산 인테리어 서비스를 시작하세요!" mobileFlushTop>
        <SignupForm />
      </AuthCard>
    </>
  );
}
