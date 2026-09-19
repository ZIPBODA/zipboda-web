"use client";

import { useState } from "react";
import Image from "next/image";
import { AddToCartButton } from "@/features/cart";
import type { WishlistItem } from "../model/types";

// figma 135:1818 찜 목록 — 3열 상품 그리드(찜 하트 토글은 클라이언트 상태)
export function WishlistGrid({ items }: { items: WishlistItem[] }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-8 md:mt-7 lg:grid-cols-3">
      {items.map((item) => (
        <WishlistCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const [wished, setWished] = useState(true);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface">
      <div className="relative h-[200px] bg-surface-secondary">
        <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 z-10 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-brand-on">-{item.discount}%</span>
        <button
          type="button"
          onClick={() => setWished((v) => !v)}
          aria-pressed={wished}
          aria-label={wished ? "찜 해제" : "찜"}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface shadow"
        >
          <HeartIcon filled={wished} />
        </button>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs text-fg-disabled">{item.brand}</p>
        <h3 className="text-sm font-semibold text-fg-heading">{item.name}</h3>
        <div className="flex items-center justify-between border-t border-line-subtle pt-3">
          <div>
            <p className="text-sm font-bold text-fg-heading">{item.price.toLocaleString()}원</p>
            <p className="text-xs text-line-strong line-through">{item.originalPrice.toLocaleString()}원</p>
          </div>
          <AddToCartButton item={{ id: item.id, brand: item.brand, name: item.name, price: item.price }} className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-on" />
        </div>
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      className="text-status-error"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}
