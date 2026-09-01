// figma PC 135:9033(로그인)·135:9218(회원가입)·219:64(비번찾기)·220:65(비번재설정) / Mobile 419:11102 등 인증 셸
// PC(≥md): 회색 배경 + 480 카드(테두리·그림자) + 텍스트 헤더. Mobile: 흰 배경 전체폭(카드 없음) + mobileHeader(로고 등)로 헤더 분기
export function AuthCard({
  icon,
  title,
  description,
  mobileHeader,
  hideTitleOnMobile,
  mobileFlushTop,
  children
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  /** 모바일 전용 헤더(예: 브랜드 로고). 모바일에서 title/description 위에 노출 */
  mobileHeader?: React.ReactNode;
  /** true면 모바일에서 title/description을 감춘다(로고만 노출 — 로그인). 기본 false(로고+제목 함께 — 비번찾기 등) */
  hideTitleOnMobile?: boolean;
  /** true면 모바일 상단 여백을 줄인다(위에 MobileAuthTopBar가 있을 때 — 회원가입) */
  mobileFlushTop?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex justify-center bg-surface px-6 pb-10 md:bg-surface-secondary md:px-6 md:pb-[100px] md:pt-20 ${mobileFlushTop ? "pt-4" : "pt-14"}`}
    >
      <div className="flex w-full max-w-[480px] flex-col gap-8 md:rounded-3xl md:border md:border-line md:bg-surface md:p-10 md:shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]">
        {icon && <div className="flex justify-center">{icon}</div>}
        {mobileHeader && <div className="flex justify-center md:hidden">{mobileHeader}</div>}
        <header className={`flex-col items-center gap-2 text-center ${hideTitleOnMobile ? "hidden md:flex" : "flex"}`}>
          <h1 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">{title}</h1>
          <p className="whitespace-pre-line text-sm text-fg-muted">{description}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
