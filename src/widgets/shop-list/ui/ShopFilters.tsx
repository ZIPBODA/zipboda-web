"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CATEGORY_OPTIONS, DISCOUNT_OPTIONS, SHOP_SORT_OPTIONS, DEFAULT_SHOP_SORT } from "@/entities/product";

// figma 135:3377 가구 쇼핑 사이드바 필터 — 상태는 URL 쿼리 파라미터(frontend-rule P6)
export function ShopFilters() {
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
    `w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
      active ? "bg-amber-200 text-brand-on" : "text-fg-muted hover:bg-surface-secondary"
    }`;

  const category = params.get("category") ?? "전체";
  const discount = params.get("discount") ?? "0";
  const sort = params.get("sort") ?? DEFAULT_SHOP_SORT;

  return (
    <div className="flex flex-col">
      <h2 className="text-base font-bold text-fg-heading">필터</h2>

      <FilterGroup label="카테고리">
        {CATEGORY_OPTIONS.map((o) => (
          <button key={o} type="button" aria-pressed={category === o} className={chipClass(category === o)} onClick={() => update("category", o, o === "전체")}>
            {o}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="최소 할인율">
        {DISCOUNT_OPTIONS.map((o) => (
          <button key={o.value} type="button" aria-pressed={discount === String(o.value)} className={chipClass(discount === String(o.value))} onClick={() => update("discount", String(o.value), o.value === 0)}>
            {o.label}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="정렬">
        {SHOP_SORT_OPTIONS.map((o) => (
          <button key={o.value} type="button" aria-pressed={sort === o.value} className={chipClass(sort === o.value)} onClick={() => update("sort", o.value, o.value === DEFAULT_SHOP_SORT)}>
            {o.label}
          </button>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 first:mt-4">
      <p className="text-xs font-semibold text-fg-muted">{label}</p>
      <div className="mt-2.5 flex flex-col gap-1">{children}</div>
    </div>
  );
}
