"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CATEGORY_OPTIONS, SHOP_SORT_OPTIONS, DEFAULT_SHOP_SORT } from "@/entities/product";

function useParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const update = (key: string, value: string, isDefault: boolean) => {
    const next = new URLSearchParams(params.toString());
    if (isDefault) next.delete(key);
    else next.set(key, value);
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  };
  return { params, update };
}

// figma 419:8208 모바일 정렬 드롭다운(PC 사이드바 정렬 라디오 대체). PC는 숨김
export function MobileShopSort() {
  const { params, update } = useParamUpdater();
  const sort = params.get("sort") ?? DEFAULT_SHOP_SORT;
  return (
    <label className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-2xsmall font-medium text-fg-body md:hidden">
      <span className="sr-only">정렬</span>
      <select value={sort} onChange={(e) => update("sort", e.target.value, e.target.value === DEFAULT_SHOP_SORT)} className="bg-transparent outline-none">
        {SHOP_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// figma 419:8208 모바일 카테고리 칩레일(PC 사이드바 카테고리 대체). 최소 할인율은 모바일 미노출
export function MobileShopCategories() {
  const { params, update } = useParamUpdater();
  const category = params.get("category") ?? "전체";
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={category === o}
          className={`shrink-0 rounded-full px-3 py-1 text-caption font-semibold transition-colors ${
            category === o ? "bg-brand text-brand-on" : "bg-surface-tertiary text-fg-muted"
          }`}
          onClick={() => update("category", o, o === "전체")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
