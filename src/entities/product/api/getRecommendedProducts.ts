import { MOCK_RECOMMENDED_PRODUCTS } from "./__mocks__/products.mock";
import type { Product } from "../model/types";

// TODO: 청약 상세 연계 추천 가구 API 미정의(API 정의서 등록 필요 — A3). 확정 시 mock 제거(A1)
export async function getRecommendedProducts(): Promise<Product[]> {
  return MOCK_RECOMMENDED_PRODUCTS;
}
