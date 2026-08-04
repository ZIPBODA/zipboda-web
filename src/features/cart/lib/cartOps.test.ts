import { describe, it, expect } from "vitest";
import { addToCart, updateQty, removeFromCart, cartCount, cartSubtotal } from "./cartOps";
import type { CartItem } from "../model/types";

const base: CartItem[] = [{ id: "a", brand: "루네", name: "할로 체어", price: 398000, qty: 1 }];

describe("cartOps", () => {
  it("새 상품 추가", () => {
    const next = addToCart(base, { id: "b", brand: "폼", name: "소파", price: 1000000 });
    expect(next).toHaveLength(2);
  });

  it("기존 상품 추가 시 수량 증가", () => {
    const next = addToCart(base, { id: "a", brand: "루네", name: "할로 체어", price: 398000 }, 2);
    expect(next).toHaveLength(1);
    expect(next[0].qty).toBe(3);
  });

  it("수량은 1 미만으로 내려가지 않음", () => {
    expect(updateQty(base, "a", 0)[0].qty).toBe(1);
  });

  it("삭제·합계·개수", () => {
    const two = addToCart(base, { id: "b", brand: "폼", name: "소파", price: 1000000 }, 2);
    expect(cartCount(two)).toBe(3);
    expect(cartSubtotal(two)).toBe(398000 + 2000000);
    expect(removeFromCart(two, "a")).toHaveLength(1);
  });
});
