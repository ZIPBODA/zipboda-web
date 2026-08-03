// figma 135:9033(로그인) · 135:9218(회원가입) 인증 카드 셸
export function AuthCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center bg-surface-secondary px-6 pb-[100px] pt-20">
      <div className="flex w-[480px] flex-col gap-8 rounded-3xl border border-line bg-surface p-10 shadow-[0_4px_20px_0_rgba(0,0,0,0.04)]">
        <header className="flex flex-col items-center gap-2">
          <h1 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">{title}</h1>
          <p className="text-sm text-fg-muted">{description}</p>
        </header>
        {children}
      </div>
    </div>
  );
}
