"use client";

import { SORT_OPTIONS, DEFAULT_SORT, FILTER_ALL, type SubscriptionFilterOptions } from "@/entities/subscription";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";

// figma 135:5618 필터 바 — 가로 1줄(지역·면적·공급기관 | 정렬 우측). 상태는 URL 쿼리 파라미터(frontend-rule P6)
export function SubscriptionFilters({ options }: { options: SubscriptionFilterOptions }) {
  const { params, update } = useSubscriptionFilters();

  // figma 135:5623 활성 chip: 지역/면적/공급기관=brand, 정렬=dark(#1A1A1A)
  const chipClass = (active: boolean, tone: "brand" | "dark") =>
    `shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? tone === "dark"
          ? "bg-fg-strong text-fg-ondark"
          : "bg-brand text-brand-on"
        : "border border-line bg-surface text-fg-muted hover:bg-surface-tertiary"
    }`;

  const current = (key: string) => params.get(key) ?? FILTER_ALL;
  const currentSort = params.get("sort") ?? DEFAULT_SORT;

  // 칩이 바 폭을 넘으면(지역·공급기관이 다 있는 실데이터) 한 줄을 지킨 채 바 안에서 가로로 민다
  return (
    <div className="flex items-center gap-4 overflow-x-auto rounded-xl bg-surface-secondary p-5">
      <FilterGroup label="지역">
        {options.regions.map((o) => (
          <button key={o} type="button" aria-pressed={current("region") === o} className={chipClass(current("region") === o, "brand")} onClick={() => update("region", o, o === FILTER_ALL)}>
            {o}
          </button>
        ))}
      </FilterGroup>
      <Divider />
      <FilterGroup label="면적">
        {options.sizeRanges.map((o) => (
          <button key={o.value} type="button" aria-pressed={current("size") === o.value} className={chipClass(current("size") === o.value, "brand")} onClick={() => update("size", o.value, o.value === FILTER_ALL)}>
            {o.label}
          </button>
        ))}
      </FilterGroup>
      <Divider />
      <FilterGroup label="공급기관">
        {options.agencies.map((o) => (
          <button key={o} type="button" aria-pressed={current("agency") === o} className={chipClass(current("agency") === o, "brand")} onClick={() => update("agency", o, o === FILTER_ALL)}>
            {o}
          </button>
        ))}
      </FilterGroup>
      {/* 남는 폭이 있을 때만 정렬을 오른쪽 끝에 붙인다. 줄어드는 칸(flex-1)에 두면 넘칠 때 정렬이 왼쪽으로 밀려 공급기관 칩을 덮는다 */}
      <div className="ml-auto flex shrink-0">
        <FilterGroup label="정렬">
          {SORT_OPTIONS.map((o) => (
            <button key={o.value} type="button" aria-pressed={currentSort === o.value} className={chipClass(currentSort === o.value, "dark")} onClick={() => update("sort", o.value, o.value === DEFAULT_SORT)}>
              {o.label}
            </button>
          ))}
        </FilterGroup>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="shrink-0 text-xs font-semibold text-fg-muted">{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="h-6 w-px shrink-0 bg-line" />;
}
