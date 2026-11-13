import { cache } from "react";
import { getProductDetail, getShopProducts } from "@/entities/product";
import { createProductSearchIndex } from "@/features/search";

/**
 * 가구는 커머스 API(S6) 전까지 web 상품 데이터에서 찾는다. 공공주택은 API 통합 검색이 찾는다.
 * cache()는 서버 컴포넌트 환경에만 있으므로 클라이언트가 닿는 배럴에 올리지 않고 앱 레이어에 둔다
 */
export const getProductSearchData = cache(async () => {
  const products = await getShopProducts();
  const details = await Promise.all(products.map((item) => getProductDetail(item.id)));
  return { products, index: createProductSearchIndex(products, details) };
});
