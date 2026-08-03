import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FurnitureSuggestions } from "./FurnitureSuggestions";

describe("FurnitureSuggestions", () => {
  it("추천 가구를 브랜드·상품명·가격으로 렌더한다", () => {
    render(
      <FurnitureSuggestions
        products={[{ id: "p1", brand: "바움 스튜디오", name: "노르딕 3인 소파", price: 1280000 }]}
      />
    );

    expect(screen.getByText("이 공간 꾸미기")).toBeInTheDocument();
    expect(screen.getByText("바움 스튜디오")).toBeInTheDocument();
    expect(screen.getByText("노르딕 3인 소파")).toBeInTheDocument();
    expect(screen.getByText("1,280,000원")).toBeInTheDocument();
  });

  it("추천 가구가 없으면 섹션 자체를 렌더하지 않는다", () => {
    const { container } = render(<FurnitureSuggestions products={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
