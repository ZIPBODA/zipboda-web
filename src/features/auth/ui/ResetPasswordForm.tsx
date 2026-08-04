"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";

const SUBMIT = "block w-full rounded-lg bg-brand px-8 py-3.5 text-center text-base font-bold text-brand-on transition-colors hover:bg-brand-hover";

// figma 220:30(입력) · 220:143(완료) 비밀번호 재설정
export function ResetPasswordForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <AuthCard
        icon={<span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-success-bg text-3xl" aria-hidden>✔️</span>}
        title="비밀번호가 변경되었습니다"
        description="새로운 비밀번호로 로그인해주세요."
      >
        <Link href="/login" className={SUBMIT}>
          로그인하기
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="새 비밀번호 설정" description="새로운 비밀번호를 입력해주세요.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO(AUTH): 비밀번호 변경 API 연동
          setDone(true);
        }}
        className="flex flex-col gap-5"
      >
        <AuthField id="password" label="새 비밀번호" type="password" placeholder="8자 이상 입력해주세요" autoComplete="new-password" />
        <AuthField id="passwordConfirm" label="새 비밀번호 확인" type="password" placeholder="비밀번호를 다시 입력해주세요" autoComplete="new-password" />
        <div className="flex flex-col gap-4">
          <button type="submit" className={SUBMIT}>비밀번호 변경하기</button>
          <Link href="/login" className="text-center text-sm font-medium text-fg-muted transition-colors hover:text-fg-body">
            로그인으로 돌아가기
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
