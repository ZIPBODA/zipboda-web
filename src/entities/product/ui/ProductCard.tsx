import Link from "next/link";
import { Rating } from "@/shared/ui";
import type { Product } from "../model/types";

// figma 135:7381·135:3431 가구 상품 카드 — 할인 배지 · 평점 · 장바구니 담기. href 주면 카드 전체가 상세 진입(stretched-link)
export function ProductCard({ item, href }: { item: Product; href?: string }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface">
      {href && <Link href={href} aria-label={item.name} className="absolute inset-0 z-10" />}

      <div className="relative h-[220px] bg-surface-secondary">
        {item.discountRate !== undefined && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-brand-on">
            -{item.discountRate}%
          </span>
        )}
        {/* figma 135:3436 카테고리 태그(가구 쇼핑 목록에서만) */}
        {item.category && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-fg-body">
            {item.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-fg-disabled">{item.brand}</p>
        <h3 className="mt-1 truncate text-sm font-semibold text-fg-heading">{item.name}</h3>
        {item.rating !== undefined && (
          <div className="mt-2 flex items-center gap-1.5">
            <Rating value={item.rating} />
            <span className="text-xs text-fg-disabled">({item.reviewCount?.toLocaleString()})</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-surface-secondary pt-3">
          <div>
            <p className="text-sm font-bold text-fg-heading">{item.price.toLocaleString()}원</p>
            {item.originalPrice !== undefined && (
              <p className="text-xs text-line-strong">{item.originalPrice.toLocaleString()}원</p>
            )}
          </div>
          <button
            type="button"
            className="relative z-20 shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-on transition-colors hover:bg-brand-hover"
          >
            장바구니 담기
          </button>
        </div>
      </div>
    </article>
  );
}
