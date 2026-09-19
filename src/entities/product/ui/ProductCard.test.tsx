import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";

const item = {
  id: "f1",
  brand: "바움 스튜디오",
  name: "노르딕 3인 소파",
  price: 1280000,
  originalPrice: 1780000,
  discountRate: 28,
  rating: 5,
  reviewCount: 342
};

describe("ProductCard", () => {
  it("할인·평점·가격을 모두 렌더한다", () => {
    render(<ProductCard item={item} />);

    expect(screen.getByText("-28%")).toBeInTheDocument();
    expect(screen.getByText("바움 스튜디오")).toBeInTheDocument();
    expect(screen.getByText("노르딕 3인 소파")).toBeInTheDocument();
    expect(screen.getByText("(342)")).toBeInTheDocument();
    expect(screen.getByText("1,280,000원")).toBeInTheDocument();
    // 디자인상 정가는 취소선 없이 연한 회색으로만 구분한다
    expect(screen.getByText("1,780,000원")).not.toHaveClass("line-through");
    expect(screen.getByRole("img", { name: "5 / 5" })).toBeInTheDocument();
  });

  it("담기 버튼은 넘겨준 것만 그린다 — 장바구니는 features라 카드가 직접 부를 수 없다", () => {
    render(<ProductCard item={item} action={<button type="button">장바구니 담기</button>} />);

    expect(screen.getByRole("button", { name: "장바구니 담기" })).toBeInTheDocument();
  });

  it("할인·평점 정보가 없으면 해당 영역을 감춘다", () => {
    render(<ProductCard item={{ id: "p1", brand: "폼 스튜디오", name: "메소 액센트 체어", price: 485000 }} />);

    expect(screen.getByText("485,000원")).toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
