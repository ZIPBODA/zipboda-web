"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthBrandLogo } from "./AuthBrandLogo";
import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";

const SUBMIT = "block w-full rounded-full bg-brand px-8 py-3.5 text-center text-base font-bold text-brand-on transition-colors hover:bg-brand-hover md:rounded-lg";

// figma 219:30(입력) · 219:117(전송 완료) 비밀번호 찾기
export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo !== null) {
    return (
      <AuthCard
        icon={<span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-tertiary text-3xl" aria-hidden>✉️</span>}
        title="이메일을 확인해주세요"
        description={`${sentTo || "example@email.com"} 으로 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해주세요.`}
      >
        <div className="flex flex-col gap-4">
          {/* TODO(AUTH): 재설정 메일 재발송 API 연동 */}
          <button type="button" className={SUBMIT}>이메일 다시 보내기</button>
          <BackToLogin />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="비밀번호 찾기" description={"가입 시 사용한 이메일을 입력해주세요.\n비밀번호 재설정 링크를 보내드립니다."} mobileHeader={<AuthBrandLogo />}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO(AUTH): 재설정 링크 발송 API 연동
          setSentTo(String(new FormData(e.currentTarget).get("email") ?? ""));
        }}
        className="flex flex-col gap-5"
      >
        <AuthField id="email" label="이메일" type="email" placeholder="이메일 주소를 입력해주세요" autoComplete="email" />
        <div className="flex flex-col gap-4">
          <button type="submit" className={SUBMIT}>재설정 링크 보내기</button>
          <BackToLogin />
        </div>
      </form>
    </AuthCard>
  );
}

function BackToLogin() {
  return (
    <Link href="/login" className="text-center text-sm font-medium text-fg-muted transition-colors hover:text-fg-body">
      로그인으로 돌아가기
    </Link>
  );
}
