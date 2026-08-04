"use client";

import { useState } from "react";
import type { InspirationItem } from "@/entities/inspiration";
import { InspirationLightbox } from "./InspirationLightbox";

// figma 135:2947 마소너리 그리드 — 카드 클릭 시 라이트박스
export function InspirationGrid({ items }: { items: InspirationItem[] }) {
  const [selected, setSelected] = useState<InspirationItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-line-subtle bg-surface-secondary py-20 text-center text-sm text-fg-muted">해당 카테고리의 집구경이 없습니다.</div>
    );
  }

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            aria-label={`${item.category} 집구경 ${item.handle}`}
            className="mb-5 block w-full break-inside-avoid overflow-hidden rounded-xl border border-line-subtle bg-surface-tertiary transition-opacity hover:opacity-90"
            style={{ height: item.height }}
          />
        ))}
      </div>
      {selected && <InspirationLightbox item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
