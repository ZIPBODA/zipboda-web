import Link from "next/link";
import { AuthField } from "./AuthField";
import { TermsAgreement } from "./TermsAgreement";

// figma 135:9218 회원가입 폼(AUTH-02)
export function SignupForm() {
  return (
    // TODO(API-001): 제출 시 회원가입 연동
    <form className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <AuthField id="name" label="이름" placeholder="이름을 입력해주세요" autoComplete="name" />
        <AuthField id="email" label="이메일" type="email" placeholder="이메일 주소를 입력해주세요" autoComplete="email" />
        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          placeholder="8자 이상, 영문, 숫자, 특수문자 조합"
          autoComplete="new-password"
        />
        <AuthField
          id="passwordConfirm"
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 한번 더 입력해주세요"
          autoComplete="new-password"
        />
        <AuthField id="phone" label="휴대폰 번호" type="tel" placeholder="전화번호를 입력해주세요" autoComplete="tel" />
      </div>

      <TermsAgreement />

      <div className="flex flex-col gap-5">
        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-8 py-3.5 text-base font-bold text-brand-on transition-colors hover:bg-brand-hover"
        >
          동의하고 회원가입
        </button>
        <p className="flex justify-center gap-2 text-xs font-medium">
          <span className="text-fg-muted">이미 계정이 있으신가요?</span>
          <Link href="/login" className="text-status-info transition-colors hover:text-blue-600">
            로그인하기
          </Link>
        </p>
      </div>
    </form>
  );
}
