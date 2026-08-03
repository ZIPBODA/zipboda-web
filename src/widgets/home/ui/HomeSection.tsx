import Link from "next/link";

interface Props {
  title: string;
  description: string;
  actionLabel: string;
  /** 디자인에 이동 대상이 정의된 섹션만 링크로 렌더한다 */
  actionHref?: string;
  last?: boolean;
  children: React.ReactNode;
}

// figma 135:7075·135:7285·135:7368 섹션 셸 — 제목/설명/전체보기 + 콘텐츠
export function HomeSection({ title, description, actionLabel, actionHref, last = false, children }: Props) {
  const action = (
    <span className="flex items-center gap-1 text-sm font-medium text-fg-disabled">
      {actionLabel}
      <ChevronRightIcon />
    </span>
  );

  return (
    <section
      className={`mx-auto w-full max-w-7xl px-6 ${last ? "pb-20 pt-10" : "border-b border-surface-secondary py-10"}`}
    >
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">{title}</h2>
          <p className="mt-1 text-sm text-fg-muted">{description}</p>
        </div>
        {actionHref ? (
          <Link href={actionHref} className="transition-colors hover:text-fg-muted">
            {action}
          </Link>
        ) : (
          action
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ChevronRightIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.33} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 4 4 4-4 4" />
    </svg>
  );
}
