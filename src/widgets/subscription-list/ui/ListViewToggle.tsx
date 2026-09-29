import Link from "next/link";
import { cn } from "@/shared/ui";
import { SUBSCRIPTION_LIST_VIEWS, type SubscriptionListView } from "../config/constants";
import { createListViewHrefBuilder, type ListSearchParams } from "../lib/createListViewHrefBuilder";

// 목록 화면 머리글에서는 작은 버튼, 지도 툴바에서는 옆 필터와 같은 높이로 선다
const MOBILE_LINK_CLASS = {
  header: "px-3 py-1.5 text-2xsmall font-medium",
  toolbar: "h-11 shrink-0 px-3 text-xs font-semibold"
} as const;

// figma PC 413:645 / Mobile 419:10092 목록·지도 전환. 필터와 지도 위치를 그대로 들고 간다
export function ListViewToggle({ searchParams, view, placement = "header" }: { searchParams: ListSearchParams; view: SubscriptionListView; placement?: keyof typeof MOBILE_LINK_CLASS }) {
  const hrefFor = createListViewHrefBuilder(searchParams);
  const other = view === "map" ? "list" : "map";

  return (
    <>
      {/* PC: 목록/지도 세그먼트 */}
      <div className="hidden shrink-0 rounded-lg bg-surface-tertiary p-1 md:flex">
        {SUBSCRIPTION_LIST_VIEWS.map((item) => {
          const active = item.key === view;
          return (
            <Link
              key={item.key}
              href={hrefFor(item.key)}
              aria-current={active ? "true" : undefined}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold ${
                active ? "bg-surface text-fg-heading shadow-sm" : "text-fg-muted"
              }`}
            >
              {item.key === "map" && "📍"}
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* 모바일: 반대편 보기로 넘어가는 버튼 하나 */}
      <Link
        href={hrefFor(other)}
        className={cn("flex items-center gap-1 rounded-lg bg-surface-tertiary text-fg-body md:hidden", MOBILE_LINK_CLASS[placement])}
      >
        {other === "map" ? "📍 지도" : "목록"}
      </Link>
    </>
  );
}
