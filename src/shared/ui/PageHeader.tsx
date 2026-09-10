import { cn } from "./cn";

/**
 * 최상위 페이지의 공통 헤더 — 타이틀·설명의 위치와 타이포 위계, 우측 액션 정렬을 통일한다.
 * 타이틀은 h1(모바일 text-h2 → PC text-h1), 설명은 text-xs → text-sm.
 * actions는 우측 정렬 슬롯(필터·세그먼트·글쓰기 버튼 등). heading 레벨을 바꿔야 하면 titleAs.
 */
export function PageHeader({
  title,
  description,
  actions,
  titleAs: TitleTag = "h1",
  className
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  titleAs?: "h1" | "h2";
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <TitleTag className="text-h2 font-bold tracking-[-0.0125em] text-fg-heading md:text-h1">{title}</TitleTag>
        {description && <p className="mt-1 text-xs text-fg-muted md:text-sm">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
