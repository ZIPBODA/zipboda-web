// figma PC 135:9033(로그인)·135:9218(회원가입)·219:64(비번찾기)·220:65(비번재설정) / Mobile 419:11102 등 인증 셸
// PC(≥md): 회색 배경 + 480 카드(테두리·그림자) + 텍스트 헤더. Mobile: 흰 배경 전체폭(카드 없음) + mobileHeader(로고 등)로 헤더 분기
export function AuthCard({
  icon,
  title,
  description,
  mobileHeader,
  children
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  /** 모바일 전용 헤더(예: 브랜드 로고). 지정 시 모바일은 이것을, PC는 title/description을 노출 */
  mobileHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center bg-surface px-6 pb-10 pt-14 md:bg-surface-secondary md:px-6 md:pb-[100px] md:pt-20">
      <div className="flex w-full max-w-[480px] flex-col gap-8 md:rounded-3xl md:border md:border-line md:bg-surface md:p-10 md:shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]">
        {icon && <div className="flex justify-center">{icon}</div>}
        {mobileHeader && <div className="flex justify-center md:hidden">{mobileHeader}</div>}
        <header className={`flex-col items-center gap-2 text-center ${mobileHeader ? "hidden md:flex" : "flex"}`}>
          <h1 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">{title}</h1>
          <p className="whitespace-pre-line text-sm text-fg-muted">{description}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
