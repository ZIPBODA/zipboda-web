import { cn } from "./cn";

/**
 * 최상위 페이지의 공통 컨테이너 — 좌우 기준선·상하 패딩·최대 폭을 통일한다.
 * 목록/그리드형 페이지는 wide(max-w-7xl), 가점·마이 등 집중형은 narrow(max-w-5xl).
 * 상세/폼처럼 목적이 다른 레이아웃(뒤로가기 바·풀블리드)은 이 컨테이너를 쓰지 않는다.
 */
type PageWidth = "wide" | "narrow";

const MAX_WIDTH: Record<PageWidth, string> = {
  wide: "max-w-7xl",
  narrow: "max-w-5xl"
};

export function PageContainer({
  width = "wide",
  className,
  children
}: {
  width?: PageWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return <main className={cn("mx-auto w-full px-4 pb-20 pt-6 md:px-6 md:pt-10", MAX_WIDTH[width], className)}>{children}</main>;
}
