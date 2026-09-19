import Link from "next/link";
import { SUBSCRIPTION_LIST_VIEWS, type SubscriptionListView } from "../config/constants";
import { createListViewHrefBuilder, type ListSearchParams } from "../lib/createListViewHrefBuilder";

// figma PC 413:645 / Mobile 419:10092 목록·지도 전환. 서버에서 링크를 만들어 필터를 그대로 들고 간다
export function ListViewToggle({ searchParams, view }: { searchParams: ListSearchParams; view: SubscriptionListView }) {
  const hrefFor = createListViewHrefBuilder(searchParams);
  const other = view === "map" ? "list" : "map";

  return (
    <>
      {/* PC: 목록/지도 세그먼트 */}
      <div className="hidden rounded-lg bg-surface-tertiary p-1 md:flex">
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
        className="flex items-center gap-1 rounded-lg bg-surface-tertiary px-3 py-1.5 text-2xsmall font-medium text-fg-body md:hidden"
      >
        {other === "map" ? "📍 지도" : "목록"}
      </Link>
    </>
  );
}
