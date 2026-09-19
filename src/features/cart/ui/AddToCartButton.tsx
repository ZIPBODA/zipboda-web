"use client";

import { useCart } from "../model/store";
import type { CartItem } from "../model/types";

/**
 * 카드 안의 담기 버튼. 카드 자체가 상세로 가는 링크라 클릭이 위로 새지 않게 막는다.
 * 상품 카드는 entities에 있어 장바구니(features)를 직접 부를 수 없으므로, 위젯이 이 버튼을 끼워 넣는다.
 */
export function AddToCartButton({ item, className }: { item: Omit<CartItem, "qty">; className?: string }) {
  const { add } = useCart();

  return (
    <button
      type="button"
      aria-label="장바구니 담기"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add(item);
      }}
      className={className ?? "relative z-20 shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-on transition-colors hover:bg-brand-hover"}
    >
      <span aria-hidden className="md:hidden">+ 담기</span>
      <span aria-hidden className="hidden md:inline">장바구니 담기</span>
    </button>
  );
}
