import type { Metadata } from "next";
import { AuthCard, SignupForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "회원가입 | 집보다",
  description: "집보다의 맞춤형 부동산 인테리어 서비스를 시작하세요"
};

// figma 135:9176 회원가입(AUTH-02)
export default function SignupPage() {
  return (
    <AuthCard title="회원가입" description="집보다의 맞춤형 부동산 인테리어 서비스를 시작하세요!">
      <SignupForm />
    </AuthCard>
  );
}
