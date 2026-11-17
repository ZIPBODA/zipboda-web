import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchSubscriptions, type Subscription } from "@/entities/subscription";
import { loadSearchSuggestions } from "./searchSuggestions";
import { GET } from "./search/suggestions/route";

vi.mock("@/entities/subscription", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/subscription")>()),
  searchSubscriptions: vi.fn()
}));
// react cache()는 서버 컴포넌트 환경에만 있다 — 상품 하나로 색인을 만들어 둔다
vi.mock("./searchData", async () => {
  const { createProductSearchIndex } = await import("@/features/search");
  const products = [{ id: "s1", name: "노원 소파", brand: "집보다", category: "소파", price: 100000, image: null }];
  return { getProductSearchData: async () => ({ products, index: createProductSearchIndex(products as never, []) }) };
});

const housing = (id: string, title: string): Subscription => ({
  id, title, agency: "LH", region: "서울", location: "서울 노원구", sizes: [], applicants: null, households: null,
  competition: null, moveIn: null, deadline: null, dday: null, image: null
});

beforeEach(() => {
  vi.mocked(searchSubscriptions).mockReset().mockResolvedValue({ items: [housing("h1", "노원 행복주택")], page: 1, pageSize: 8, totalCount: 31 });
});

describe("헤더 검색 추천", () => {
  it("공공주택(API)과 가구를 한 순위로 섞고, 전체 건수는 두 몫을 더한다", async () => {
    const result = await loadSearchSuggestions("  노원 ");
    expect(searchSubscriptions).toHaveBeenCalledWith("노원", { pageSize: 8 });
    expect(result.totalCount).toBe(32);
    expect(result.entries.map((entry) => entry.id)).toEqual(["h1", "s1"]);
  });

  it("빈 검색어는 API를 부르지 않는다", async () => {
    await expect(loadSearchSuggestions("   ")).resolves.toEqual({ entries: [], totalCount: 0 });
    expect(searchSubscriptions).not.toHaveBeenCalled();
  });

  it("GET /search/suggestions?q=는 같은 추천을 JSON으로 준다", async () => {
    const response = await GET(new Request(`http://localhost/search/suggestions?${new URLSearchParams({ q: "노원" })}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ totalCount: 32, entries: [{ id: "h1" }, { id: "s1" }] });
  });
});
