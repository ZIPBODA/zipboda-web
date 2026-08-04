"use client";

import Link from "next/link";
import { useCart } from "../model/store";
import type { CartItem } from "../model/types";

// figma 135:8433(데이터)·135:8008(빈) 장바구니 슬라이드오버
export function CartDrawer() {
  const { items, isOpen, count, subtotal, close, remove, setQty } = useCart();

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="장바구니"
        aria-modal={isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col bg-surface shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center justify-between border-b border-line-subtle px-6 py-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-fg-heading">장바구니</h2>
            {count > 0 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-on">{count}</span>}
          </div>
          <button type="button" onClick={close} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-fg-disabled hover:bg-surface-secondary">
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <EmptyCart onClose={close} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartRow key={item.id} item={item} onQty={setQty} onRemove={remove} />
                ))}
              </ul>
            </div>
            <footer className="border-t border-line-subtle px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">소계 ({count}개 상품)</span>
                <span className="text-base font-bold text-fg-heading">{subtotal.toLocaleString()}원</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-fg-disabled">배송비</span>
                <span className="text-xs font-semibold text-status-success">50만원 이상 무료</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line-subtle pt-4">
                <span className="text-base font-bold text-fg-heading">합계</span>
                <span className="text-h2 font-bold text-fg-heading">{subtotal.toLocaleString()}원</span>
              </div>
              {/* TODO(CART-02): 결제 플로우 연동(추후) */}
              <button type="button" className="mt-5 h-14 w-full rounded-2xl bg-brand text-base font-bold text-brand-on shadow-md">
                결제하기 → {subtotal.toLocaleString()}원
              </button>
              <button type="button" onClick={close} className="mt-2 h-11 w-full rounded-2xl text-sm font-medium text-fg-disabled">
                쇼핑 계속하기
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

function CartRow({ item, onQty, onRemove }: { item: CartItem; onQty: (id: string, qty: number) => void; onRemove: (id: string) => void }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl bg-surface-secondary p-4">
      <div className="h-16 w-16 shrink-0 rounded-xl bg-surface-tertiary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-fg-disabled">{item.brand}</p>
        <p className="truncate text-sm font-semibold text-fg-heading">{item.name}</p>
        <p className="mt-0.5 text-sm font-bold text-fg-heading">{(item.price * item.qty).toLocaleString()}원</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-[34px] items-center rounded-xl border border-line bg-surface">
          <button type="button" aria-label="수량 감소" onClick={() => onQty(item.id, item.qty - 1)} className="flex h-full w-8 items-center justify-center text-lg text-fg-body">
            −
          </button>
          <span className="w-8 text-center text-sm font-bold text-fg-heading">{item.qty}</span>
          <button type="button" aria-label="수량 증가" onClick={() => onQty(item.id, item.qty + 1)} className="flex h-full w-8 items-center justify-center text-lg text-fg-body">
            +
          </button>
        </div>
        <button type="button" onClick={() => onRemove(item.id)} className="text-xs text-fg-disabled hover:text-status-error">
          삭제
        </button>
      </div>
    </li>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl" aria-hidden>
        🛋️
      </span>
      <p className="text-base font-semibold text-gray-700">장바구니가 비어있습니다</p>
      <p className="max-w-[280px] text-sm text-fg-disabled">가구 컬렉션을 둘러보고 장바구니에 담아보세요.</p>
      <Link href="/shop" onClick={onClose} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-brand-on">
        쇼핑하기
      </Link>
    </div>
  );
}
