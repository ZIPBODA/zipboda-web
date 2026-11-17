import type { Product, ProductDetail } from "@/entities/product";
import type { Subscription } from "@/entities/subscription";
import type { SearchEntry } from "../model/types";

/** 공고는 API가 찾아 준다(API-095). 추천 한 줄에 보일 값과 순위를 매길 필드만 남긴다 */
export function toHousingSearchEntry(item: Subscription): SearchEntry {
  return {
    id: item.id,
    kind: "housing",
    name: item.title,
    href: `/subscriptions/${encodeURIComponent(item.id)}`,
    description: item.location,
    context: [item.agency, item.region].filter(Boolean).join(" · "),
    fields: [item.location, item.region, item.agency, item.supplyType].filter((field): field is string => Boolean(field))
  };
}

/** 가구는 커머스 API(S6) 전까지 web 상품 데이터에서 찾는다 */
export function createProductSearchIndex(products: readonly Product[], productDetails: readonly (ProductDetail | null)[]): SearchEntry[] {
  return products.map((item): SearchEntry => {
    const detail = productDetails.find((entry) => entry?.id === item.id);
    return {
      id: item.id, kind: "product", name: item.name,
      href: `/shop/${encodeURIComponent(item.id)}`,
      description: [item.brand, item.category].filter(Boolean).join(" · "), context: "", price: item.price,
      fields: [item.brand, item.category, detail?.description]
        .filter((field): field is string => Boolean(field))
    };
  });
}
