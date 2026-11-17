import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { searchSubscriptions, type Subscription, type SubscriptionPage } from "@/entities/subscription";
import SearchPage from "./page";

vi.mock("@/entities/subscription", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/subscription")>()),
  searchSubscriptions: vi.fn()
}));
// react cache()는 서버 컴포넌트 환경에만 있다 — 같은 상품 데이터로 색인만 만들어 둔다
vi.mock("../searchData", async () => {
  const { getProductDetail, getShopProducts } = await import("@/entities/product");
  const { createProductSearchIndex } = await import("@/features/search");
  return {
    getProductSearchData: async () => {
      const products = await getShopProducts();
      return { products, index: createProductSearchIndex(products, await Promise.all(products.map((item) => getProductDetail(item.id)))) };
    }
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/search", useSearchParams: () => new URLSearchParams() }));

const housing = (id: string): Subscription => ({
  id, title: `면목 주택 ${id}`, agency: "LH", status: "마감", region: "서울", location: "서울 중랑구", sizes: [], applicants: null,
  households: null, competition: null, moveIn: null, deadline: null, dday: null, image: null
});
const pageOf = (items: Subscription[], totalCount = items.length): SubscriptionPage => ({ items, page: 1, pageSize: 20, totalCount });

beforeEach(() => {
  vi.mocked(searchSubscriptions).mockReset().mockResolvedValue(pageOf([]));
});

describe("검색 결과 페이지", () => {
  it.each([undefined, "", "   "])("검색어 %s가 비어 있으면 검색하지 않고 안내한다", async (q) => {
    render(await SearchPage({ searchParams: { q } }));
    expect(searchSubscriptions).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "통합 검색" })).toBeInTheDocument();
  });

  it("공공주택은 API 검색 결과를, 건수는 전체 건수를 보이고 남은 공고는 '더 보기'로 잇는다", async () => {
    vi.mocked(searchSubscriptions).mockResolvedValue(pageOf([housing("a"), housing("b")], 45));
    render(await SearchPage({ searchParams: { q: "면목" } }));
    expect(searchSubscriptions).toHaveBeenCalledWith("면목");
    const section = screen.getByRole("region", { name: /공공주택/ });
    expect(within(section).getByRole("heading")).toHaveTextContent("공공주택 45건");
    expect(within(section).getAllByRole("link").length).toBeGreaterThan(0);
    expect(within(section).getByRole("button", { name: "더 보기" })).toBeInTheDocument();
    expect(screen.getByText("검색된 가구가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("총 45건")).toBeInTheDocument();
  });

  it("URL 검색어 배열의 첫 값을 사용해 상품 상세 링크를 표시한다", async () => {
    render(await SearchPage({ searchParams: { q: ["소파", "무시"] } }));
    expect(searchSubscriptions).toHaveBeenCalledWith("소파");
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
