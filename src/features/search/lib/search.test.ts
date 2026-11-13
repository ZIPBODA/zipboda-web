import { describe, expect, it } from "vitest";
import { getProductDetail, getShopProducts } from "@/entities/product";
import type { SearchEntry } from "../model/types";
import { createProductSearchIndex, toHousingSearchEntry } from "./createSearchIndex";
import { getSuggestions, mergeSearchResults, normalizeQuery, searchAll, searchHref } from "./search";

function entry(id: string, name: string, fields: string[] = [], kind: SearchEntry["kind"] = "product"): SearchEntry {
  return { id, kind, name, fields, description: "", context: "", href: `/shop/${id}` };
}

describe("통합 검색", () => {
  const index = [entry("aux", "서울 주택", ["소파"], "housing"), entry("contains", "원목 소파"), entry("prefix", "소파 세트"), entry("exact", "소파")];

  it("정확 일치 → 접두어 → 이름 포함 → 보조 필드 순으로 정렬한다", () => {
    expect(searchAll(index, "소파").map((item) => item.id)).toEqual(["exact", "prefix", "contains", "aux"]);
    expect(searchAll(index, "소파").map((item) => item.kind)).toContain("housing");
  });

  it("공백과 대소문자를 정규화하고 한글·숫자를 보존한다", () => {
    expect(normalizeQuery("  LH  서울\n 101  ")).toBe("lh 서울 101");
    expect(searchAll([entry("1", "LH   서울 101")], " lh 서울 101 ")).toHaveLength(1);
    expect(searchAll([entry("1", "주택", ["LH 서울 101"], "housing")], "lh")).toHaveLength(1);
  });

  it.each([null, undefined, "", " \n ", "존재하지않음"])("빈 값과 미일치 검색어 %s는 빈 결과다", (query) => {
    expect(searchAll(index, query)).toEqual([]);
  });

  it("특수문자를 정규식이 아닌 문자 그대로 검색한다", () => {
    expect(searchAll([entry("1", "선반 [A+B] 2")], "[A+B]")).toHaveLength(1);
    expect(searchAll(index, ".*")).toEqual([]);
    expect(new URL(searchHref("  A&B + #가구  "), "https://example.com").searchParams.get("q")).toBe("A&B + #가구");
    expect(searchAll(index, "가".repeat(10000))).toEqual([]);
  });

  it("추천은 전체 순위를 유지하는 상위 8건이며 한 종류만 있어도 8건까지 표시한다", () => {
    const entries = Array.from({ length: 12 }, (_, i) => entry(String(i), "의자"));
    const all = searchAll(entries, "의자");
    expect(getSuggestions(all)).toEqual(all.slice(0, 8));
    expect(all).toHaveLength(12);
    expect(entries).toHaveLength(12);
  });

  it("상품 색인은 브랜드·분류·설명을 검색하며 전체 상세 모델은 싣지 않는다", async () => {
    const products = await getShopProducts();
    const details = await Promise.all(products.map((item) => getProductDetail(item.id)));
    const actual = createProductSearchIndex(products, details);
    expect(actual).toHaveLength(products.length);
    for (const detail of details) {
      if (detail?.description) expect(searchAll(actual, detail.description).some((item) => item.id === detail.id)).toBe(true);
    }
    expect(actual.every((item) => item.kind === "product" && !("images" in item))).toBe(true);
    expect(createProductSearchIndex(products, [])).toHaveLength(actual.length);
  });
});

describe("공고와 가구 추천 섞기", () => {
  const housing = (id: string, title: string): SearchEntry =>
    toHousingSearchEntry({ id, title, agency: "LH", region: "서울", location: "서울 노원구", supplyType: "행복주택", sizes: [], applicants: null, households: null, competition: null, moveIn: null, deadline: null, dday: null, image: null });

  it("공고 항목은 이름·주소·기관·지역을 보이고 상세로 이어진다", () => {
    expect(housing("cell 1", "노원 행복주택")).toEqual({
      id: "cell 1", kind: "housing", name: "노원 행복주택", href: "/subscriptions/cell%201",
      description: "서울 노원구", context: "LH · 서울", fields: ["서울 노원구", "서울", "LH", "행복주택"]
    });
  });

  it("한 순위로 섞되 같은 순위면 공고가 먼저이고, API가 정한 공고 순서는 지킨다", () => {
    const merged = mergeSearchResults(
      [housing("h-other", "중랑 주택"), housing("h-in", "노원 소파 주택"), housing("h-same", "소파")],
      [entry("p-prefix", "소파 세트"), entry("p-same", "소파"), entry("p-none", "의자")],
      "소파"
    );
    expect(merged.map((item) => item.id)).toEqual(["h-same", "p-same", "p-prefix", "h-in", "h-other"]);
  });

  // API는 공고명·시군구로도 찾는다 — web이 모르는 필드로 맞은 공고도 버리지 않고 맨 뒤 순위에 둔다
  it("이름·필드로 맞지 않는 공고도 API가 찾았으면 '다른 필드' 순위로 남긴다", () => {
    const merged = mergeSearchResults([housing("h-notice", "중랑 주택")], [entry("p-field", "의자", ["청년"])], "청년");
    expect(merged.map((item) => item.id)).toEqual(["h-notice", "p-field"]);
    expect(mergeSearchResults([housing("h", "주택")], [], "  ")).toEqual([]);
  });
});
