import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "비밀번호 찾기 | 집보다",
  description: "가입한 이메일로 비밀번호 재설정 링크를 받으세요."
};

// figma 219:30·219:117 비밀번호 찾기(AUTH-03)
export default function FindPasswordPage() {
  return <ForgotPasswordForm />;
}
