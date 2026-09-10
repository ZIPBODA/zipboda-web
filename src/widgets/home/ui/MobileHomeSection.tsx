import Link from "next/link";

// figma 419:10710 등 모바일 홈 섹션 셸 — 흰 블록 + 헤더(제목 13/700 + 전체보기 11)
export function MobileHomeSection({
  title,
  actionLabel,
  actionHref,
  children
}: {
  title: string;
  actionLabel: string;
  actionHref?: string;
  children: React.ReactNode;
}) {
  const action = (
    <span className="flex items-center gap-0.5 text-2xsmall text-fg-disabled">
      {actionLabel}
      <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.33} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m6 4 4 4-4 4" />
      </svg>
    </span>
  );
  return (
    <section className="bg-surface py-4">
      <div className="flex items-center justify-between px-3">
        <h2 className="text-compact font-bold text-fg-heading">{title}</h2>
        {actionHref ? (
          <Link href={actionHref}>{action}</Link>
        ) : (
          action
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
