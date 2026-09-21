import { describe, expect, it } from "vitest";
import { getProductDetail, getShopProducts } from "@/entities/product";
import { getSubscriptionDetail, getSubscriptions } from "@/entities/subscription";
import type { SearchEntry } from "../model/types";
import { createSearchIndex } from "./createSearchIndex";
import { getSuggestions, normalizeQuery, searchAll, searchHref } from "./search";

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

  it("실제 entity API의 주소·기관·유형·설명을 검색하며 전체 상세 모델은 전송하지 않는다", async () => {
    const [housing, products] = await Promise.all([getSubscriptions(), getShopProducts()]);
    const [housingDetails, productDetails] = await Promise.all([
      Promise.all(housing.map((item) => getSubscriptionDetail(item.id))),
      Promise.all(products.map((item) => getProductDetail(item.id)))
    ]);
    const actual = createSearchIndex(housing, products, housingDetails, productDetails);
    expect(actual).toHaveLength(housing.length + products.length);
    for (const detail of housingDetails) {
      if (!detail) continue;
      for (const query of [detail.address, detail.agency, detail.supplyType].filter(Boolean)) {
        expect(searchAll(actual, query).some((item) => item.kind === "housing" && item.id === detail.id)).toBe(true);
      }
    }
    for (const detail of productDetails) {
      if (detail?.description) expect(searchAll(actual, detail.description).some((item) => item.id === detail.id)).toBe(true);
    }
    expect(actual.every((item) => !("units" in item) && !("images" in item))).toBe(true);
    expect(createSearchIndex(housing, products, [], [])).toHaveLength(actual.length);
  });
});
