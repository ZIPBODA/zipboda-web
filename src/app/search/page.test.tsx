import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { getSubscriptions } from "@/entities/subscription";
import { getShopProducts } from "@/entities/product";
import { createSearchIndex } from "@/features/search";
import { getSearchData } from "../searchData";
import SearchPage from "./page";

vi.mock("../searchData", () => ({ getSearchData: vi.fn() }));

beforeEach(async () => {
  const [subscriptions, products] = await Promise.all([getSubscriptions(), getShopProducts()]);
  vi.mocked(getSearchData).mockReset().mockResolvedValue({ subscriptions, products, index: createSearchIndex(subscriptions, products, [], []) });
});

describe("검색 결과 페이지", () => {
  it.each([undefined, "", "   "])("검색어 %s가 비어 있으면 검색하지 않고 안내한다", async (q) => {
    render(await SearchPage({ searchParams: { q } }));
    expect(getSearchData).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "통합 검색" })).toBeInTheDocument();
  });

  it("주택 결과와 빈 가구 섹션을 표시한다", async () => {
    render(await SearchPage({ searchParams: { q: "면목" } }));
    const housing = screen.getByRole("region", { name: /공공주택/ });
    expect(within(housing).getAllByRole("link").length).toBeGreaterThan(0);
    expect(screen.getByText("검색된 가구가 없습니다.")).toBeInTheDocument();
  });

  it("URL 검색어 배열의 첫 값을 사용해 상품 상세 링크를 표시한다", async () => {
    render(await SearchPage({ searchParams: { q: ["소파", "무시"] } }));
    const furniture = screen.getByRole("region", { name: /가구/ });
    expect(within(furniture).getAllByRole("link")[0].getAttribute("href")).toMatch(/^\/shop\//);
    expect(screen.getByText("검색된 공공주택이 없습니다.")).toBeInTheDocument();
  });

  it("전체 미일치는 전체 빈 상태로 안내한다", async () => {
    render(await SearchPage({ searchParams: { q: "<없는결과>&" } }));
    expect(screen.getByText("‘<없는결과>&’에 대한 검색 결과가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("다른 검색어로 검색해보세요.")).toBeInTheDocument();
    expect(screen.queryByRole("region")).toBeNull();
  });
});
