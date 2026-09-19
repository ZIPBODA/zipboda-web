"use client";

import { useState } from "react";
import { Rating } from "@/shared/ui";
import type { ProductDetail } from "@/entities/product";
import { useCart } from "@/features/cart";
import { PRODUCT_BENEFITS, DETAIL_TABS, type DetailTabId } from "../config/constants";
import { PENDING_CLASS, PENDING_TITLE } from "@/shared/config/pending";

// figma 135:3901 상품 정보 패널 — 색상·수량·탭은 클라이언트 상태
export function ProductInfoPanel({ product }: { product: ProductDetail }) {
  const { add } = useCart();
  const [color, setColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<DetailTabId>("detail");

  return (
    <div>
      <p className="text-sm text-fg-disabled">{product.brand}</p>
      <h1 className="mt-1 text-h2 font-bold leading-tight tracking-[-0.0167em] text-fg-heading md:text-[30px]">{product.name}</h1>

      <div className="mt-3 flex items-center gap-3">
        <Rating value={product.rating} />
        <span className="text-sm text-fg-muted">
          {product.rating} ({product.reviewCount.toLocaleString()}개 리뷰)
        </span>
        {product.inStock && <span className="rounded-full bg-status-success-bg px-2.5 py-0.5 text-xs font-semibold text-status-success-text">재고 있음</span>}
      </div>

      <div className="mt-5 flex items-end gap-3">
        <span className="text-h2 font-bold text-fg-heading md:text-[30px]">{product.price.toLocaleString()}원</span>
        {product.originalPrice !== undefined && <span className="pb-0.5 text-base text-line-strong line-through">{product.originalPrice.toLocaleString()}원</span>}
        {product.discountRate !== undefined && <span className="mb-1 rounded-full bg-brand px-2.5 py-1 text-sm font-bold text-brand-on">-{product.discountRate}%</span>}
      </div>

      {/* figma 135:3929 색상 */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-700">색상</p>
        <div className="mt-2.5 flex gap-2">
          {product.colors.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(i)}
              aria-label={`색상 ${i + 1}`}
              aria-pressed={color === i}
              style={{ backgroundColor: c }}
              className={`h-8 w-8 rounded-full ${color === i ? "ring-2 ring-brand ring-offset-1" : "ring-1 ring-line"}`}
            />
          ))}
        </div>
      </div>

      {/* figma 135:3937 수량 */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-700">수량</p>
        <div className="mt-2.5 flex w-[136px] items-center gap-1 rounded-2xl bg-surface-tertiary p-1">
          <StepButton label="수량 감소" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            −
          </StepButton>
          <span className="w-10 text-center text-base font-bold text-fg-heading">{qty}</span>
          <StepButton label="수량 증가" onClick={() => setQty((q) => q + 1)}>
            +
          </StepButton>
        </div>
      </div>

      {/* figma 135:3948(PC 인라인) / 419:8696(모바일 하단 고정) 액션 */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex gap-3 border-t border-line-subtle bg-surface px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
        <button
          type="button"
          onClick={() => add({ id: product.id, brand: product.brand, name: product.name, price: product.price }, qty)}
          className="flex-1 rounded-2xl bg-brand py-4 text-base font-bold text-brand-on shadow-md"
        >
          장바구니 담기 — {(product.price * qty).toLocaleString()}원
        </button>
        <button type="button" aria-label="찜" disabled title={PENDING_TITLE} className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-line text-fg-muted ${PENDING_CLASS}`}>
          <HeartIcon />
        </button>
      </div>

      {/* figma 135:3954 혜택 — 모바일 미노출(419:8539) */}
      <div className="mt-6 hidden gap-3 md:flex">
        {PRODUCT_BENEFITS.map((b) => (
          <div key={b.label} className="flex flex-1 items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-2 text-xs text-fg-body">
            <span aria-hidden>{b.icon}</span>
            <span>{b.label}</span>
          </div>
        ))}
      </div>

      {/* figma 135:3970 탭 + 상세 */}
      <div className="mt-8 border-t border-line-subtle">
        <div role="tablist" aria-label="상품 상세" className="flex border-b border-line-subtle">
          {DETAIL_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${active ? "border-brand text-fg-heading" : "border-transparent text-fg-muted hover:text-fg-body"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="py-4 text-sm text-fg-body">
          {tab === "detail" && <p>{product.description}</p>}
          {tab === "size" && <p className="text-fg-muted">크기 정보는 준비 중입니다.</p>}
          {tab === "review" && <p className="text-fg-muted">리뷰는 준비 중입니다.</p>}
        </div>
      </div>
    </div>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg font-bold text-gray-700 shadow-sm">
      {children}
    </button>
  );
}

function HeartIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}
