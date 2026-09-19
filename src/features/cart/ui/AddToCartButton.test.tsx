import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "../model/store";
import { AddToCartButton } from "./AddToCartButton";

const ITEM = { id: "s1", brand: "루네 오브제", name: "할로 라운지 체어", price: 398000 };

function CartSize() {
  const { count } = useCart();
  return <output>{count}</output>;
}

describe("AddToCartButton", () => {
  it("누르면 장바구니에 담는다", () => {
    render(
      <CartProvider>
        <AddToCartButton item={ITEM} />
        <CartSize />
      </CartProvider>
    );

    expect(screen.getByRole("status").textContent).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "장바구니 담기" }));
    expect(screen.getByRole("status").textContent).toBe("1");
  });

  it("카드 전체가 링크라 클릭이 위로 새지 않는다", () => {
    let navigated = false;
    render(
      <CartProvider>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a href="/shop/s1" onClick={() => { navigated = true; }}>
          카드
          <AddToCartButton item={ITEM} />
        </a>
      </CartProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "장바구니 담기" }));
    expect(navigated).toBe(false);
  });
});
