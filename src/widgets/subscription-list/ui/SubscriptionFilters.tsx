"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { REGION_OPTIONS, AGENCY_OPTIONS, SIZE_OPTIONS, SORT_OPTIONS, DEFAULT_SORT } from "@/entities/subscription";

// figma 135:5598 필터 바 — 지역/면적/공급기관/정렬. 상태는 URL 쿼리 파라미터로 관리(frontend-rule P6)
export function SubscriptionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (key: string, value: string, isDefault: boolean) => {
    const next = new URLSearchParams(params.toString());
    if (isDefault) next.delete(key);
    else next.set(key, value);
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  };

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs transition-colors ${
      active ? "bg-fg-strong font-bold text-fg-ondark" : "border border-line bg-surface text-fg-body hover:bg-surface-secondary"
    }`;
  const sortChipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs transition-colors ${
      active ? "bg-brand font-bold text-brand-on" : "border border-line bg-surface text-fg-body hover:bg-surface-secondary"
    }`;

  const current = (key: string) => params.get(key) ?? "전체";
  const currentSort = params.get("sort") ?? DEFAULT_SORT;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <FilterGroup label="지역">
        {REGION_OPTIONS.map((o) => (
          <button key={o} type="button" aria-pressed={current("region") === o} className={chipClass(current("region") === o)} onClick={() => update("region", o, o === "전체")}>
            {o}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label="면적">
        {SIZE_OPTIONS.map((o) => (
          <button key={o} type="button" aria-pressed={current("size") === o} className={chipClass(current("size") === o)} onClick={() => update("size", o, o === "전체")}>
            {o === "전체" ? o : `${o}㎡`}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label="공급기관">
        {AGENCY_OPTIONS.map((o) => (
          <button key={o} type="button" aria-pressed={current("agency") === o} className={chipClass(current("agency") === o)} onClick={() => update("agency", o, o === "전체")}>
            {o}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label="정렬">
        {SORT_OPTIONS.map((o) => (
          <button key={o.value} type="button" aria-pressed={currentSort === o.value} className={sortChipClass(currentSort === o.value)} onClick={() => update("sort", o.value, o.value === DEFAULT_SORT)}>
            {o.label}
          </button>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-16 shrink-0 pt-1.5 text-sm font-medium text-fg-body">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
