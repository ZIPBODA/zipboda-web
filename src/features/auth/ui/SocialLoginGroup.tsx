import Image from "next/image";
import kakaoButton from "@/shared/assets/social/kakao-login-button.svg";
import naverButton from "@/shared/assets/social/naver-login-button.svg";
import googleButton from "@/shared/assets/social/google-login-button.svg";

// figma 135:9053·135:9057 소셜 로그인 — 카카오(가로) + 네이버·구글(원형)
const CIRCLE_PROVIDERS = [
  { name: "네이버", asset: naverButton },
  { name: "구글", asset: googleButton }
];

export function SocialLoginGroup() {
  return (
    <>
      <div className="flex items-center gap-4">
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="text-xs text-fg-disabled">또는</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        {/* TODO(API-003): 소셜 로그인 연동 시 provider별 인증 요청 연결 */}
        <button type="button" aria-label="카카오 로그인" className="overflow-hidden rounded-md">
          <Image src={kakaoButton} alt="" width={183} height={45} />
        </button>
        <div className="flex items-center justify-center gap-4">
          {CIRCLE_PROVIDERS.map((provider) => (
            <button
              key={provider.name}
              type="button"
              aria-label={`${provider.name} 로그인`}
              className="overflow-hidden rounded-full"
            >
              <Image src={provider.asset} alt="" width={44} height={44} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
