"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { INSPIRATION_CATEGORIES } from "@/entities/inspiration";

// figma 135:2932 카테고리 칩 — 상태는 URL 쿼리 파라미터(frontend-rule P6)
export function InspirationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("category") ?? "전체";

  const select = (category: string) => {
    const next = new URLSearchParams(params.toString());
    if (category === "전체") next.delete("category");
    else next.set("category", category);
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {INSPIRATION_CATEGORIES.map((c) => {
        const active = current === c;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => select(c)}
            className={`rounded-full px-3 py-1 text-caption font-medium transition-colors md:px-4 md:py-1.5 md:text-sm ${active ? "bg-brand text-brand-on" : "bg-surface-tertiary text-fg-muted hover:bg-line"}`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
