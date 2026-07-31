"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { REGION_OPTIONS, AGENCY_OPTIONS, SIZE_OPTIONS, SORT_OPTIONS, DEFAULT_SORT } from "@/entities/subscription";

// figma 135:5601 필터 바 — 가로 1줄(지역·면적·공급기관 | 정렬), 칩 radius8·활성 brand. 상태는 URL 쿼리 파라미터(frontend-rule P6)
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
    `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? "bg-brand text-brand-on" : "bg-surface text-fg-body hover:bg-surface-tertiary"
    }`;

  const current = (key: string) => params.get(key) ?? "전체";
  const currentSort = params.get("sort") ?? DEFAULT_SORT;

  return (
    <div className="flex items-center gap-4 overflow-x-auto rounded-xl bg-surface-secondary p-5">
      <FilterGroup label="지역">
        {REGION_OPTIONS.map((o) => (
          <button key={o} type="button" aria-pressed={current("region") === o} className={chipClass(current("region") === o)} onClick={() => update("region", o, o === "전체")}>
            {o}
          </button>
        ))}
      </FilterGroup>
      <Divider />
      <FilterGroup label="면적">
        {SIZE_OPTIONS.map((o) => (
          <button key={o} type="button" aria-pressed={current("size") === o} className={chipClass(current("size") === o)} onClick={() => update("size", o, o === "전체")}>
            {o === "전체" ? o : `${o}㎡`}
          </button>
        ))}
      </FilterGroup>
      <Divider />
      <FilterGroup label="공급기관">
        {AGENCY_OPTIONS.map((o) => (
          <button key={o} type="button" aria-pressed={current("agency") === o} className={chipClass(current("agency") === o)} onClick={() => update("agency", o, o === "전체")}>
            {o}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label="정렬" className="ml-auto">
        {SORT_OPTIONS.map((o) => (
          <button key={o.value} type="button" aria-pressed={currentSort === o.value} className={chipClass(currentSort === o.value)} onClick={() => update("sort", o.value, o.value === DEFAULT_SORT)}>
            {o.label}
          </button>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 ${className ?? ""}`}>
      <span className="shrink-0 text-sm font-medium text-fg-muted">{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="h-6 w-px shrink-0 self-center bg-line" />;
}
