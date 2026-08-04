import { describe, it, expect } from "vitest";
import { getShopProducts } from "./getShopProducts";

describe("getShopProducts", () => {
  it("기본: 전체 8건 인기순(리뷰수 내림차순)", async () => {
    const list = await getShopProducts();
    expect(list).toHaveLength(8);
    expect(list[0].reviewCount).toBe(521);
  });

  it("카테고리 필터: 의자 3건", async () => {
    const list = await getShopProducts({ category: "의자" });
    expect(list).toHaveLength(3);
    expect(list.every((p) => p.category === "의자")).toBe(true);
  });

  it("최소 할인율 25%+: 노르딕 소파(28%)만", async () => {
    const list = await getShopProducts({ discount: 25 });
    expect(list.every((p) => (p.discountRate ?? 0) >= 25)).toBe(true);
    expect(list).toHaveLength(1);
  });

  it("가격 오름차순 정렬", async () => {
    const list = await getShopProducts({ sort: "PRICE_ASC" });
    const prices = list.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
