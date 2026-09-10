import Link from "next/link";
import { AuthField } from "./AuthField";
import { SocialLoginGroup } from "./SocialLoginGroup";

// figma 135:9033 로그인 폼(AUTH-01)
export function LoginForm() {
  return (
    <>
      {/* TODO(API-002): 제출 시 이메일 로그인 연동 */}
      <form className="flex flex-col gap-8">
        <div className="flex flex-col gap-5">
          <AuthField id="email" label="이메일" type="email" placeholder="이메일 주소를 입력해주세요" autoComplete="email" />
          <AuthField
            id="password"
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            autoComplete="current-password"
          />
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="w-full rounded-full bg-brand px-8 py-3.5 text-base font-bold text-brand-on transition-colors hover:bg-brand-hover md:rounded-lg"
          >
            로그인
          </button>
          <div className="flex justify-center gap-4 text-xs font-medium">
            <Link href="/password/find" className="text-fg-muted transition-colors hover:text-fg-body">
              비밀번호 찾기
            </Link>
            <span aria-hidden className="text-line-strong">
              |
            </span>
            <Link href="/signup" className="text-status-info transition-colors hover:text-blue-600">
              회원가입
            </Link>
          </div>
        </div>
      </form>

      <SocialLoginGroup />
    </>
  );
}
