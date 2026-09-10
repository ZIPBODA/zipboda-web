"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import type { InspirationItem } from "@/entities/inspiration";
import { InspirationLightbox } from "./InspirationLightbox";

// figma 419:9617 모바일 카드 높이 = 데스크톱 마소너리 높이 × 0.42(실측 비율). 1열 full-width에서 과크롭 방지
const MOBILE_HEIGHT_RATIO = 0.42;

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
      <div className="columns-1 gap-4 md:columns-2 md:gap-5 lg:columns-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            aria-label={`${item.category} 집구경 ${item.handle}`}
            className="relative mb-5 block h-[var(--h-mobile)] w-full break-inside-avoid overflow-hidden rounded-xl border border-line-subtle bg-surface-tertiary transition-opacity hover:opacity-90 md:h-[var(--h-desktop)]"
            style={{
              "--h-mobile": `${Math.round(item.height * MOBILE_HEIGHT_RATIO)}px`,
              "--h-desktop": `${item.height}px`
            } as CSSProperties}
          >
            <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
          </button>
        ))}
      </div>
      {selected && <InspirationLightbox item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
