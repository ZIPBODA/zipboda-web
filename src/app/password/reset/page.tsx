import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "비밀번호 재설정 | 집보다",
  description: "새 비밀번호를 설정하세요."
};

// figma 220:30·220:143 비밀번호 재설정(AUTH-04)
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
