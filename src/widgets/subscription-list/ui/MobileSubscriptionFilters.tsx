"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FILTER_ALL, type SubscriptionFilterOptions } from "@/entities/subscription";

// figma 419:10100 모바일 필터 — 무라벨 칩레일(지역 + 공급기관). 면적·정렬은 모바일 미노출. URL 쿼리 파라미터
export function MobileSubscriptionFilters({ options }: { options: SubscriptionFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (key: string, value: string, isDefault: boolean) => {
    const next = new URLSearchParams(params.toString());
    if (isDefault) next.delete(key);
    else next.set(key, value);
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  };

  const pill = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1 text-caption font-semibold transition-colors ${
      active ? "bg-brand text-brand-on" : "bg-surface-tertiary text-fg-muted"
    }`;

  const current = (key: string) => params.get(key) ?? FILTER_ALL;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.regions.map((o) => (
        <button key={`r-${o}`} type="button" aria-pressed={current("region") === o} className={pill(current("region") === o)} onClick={() => update("region", o, o === FILTER_ALL)}>
          {o}
        </button>
      ))}
      <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
      {options.agencies.map((o) => (
        <button key={`a-${o}`} type="button" aria-pressed={current("agency") === o} className={pill(current("agency") === o)} onClick={() => update("agency", o, o === FILTER_ALL)}>
          {o}
        </button>
      ))}
    </div>
  );
}
