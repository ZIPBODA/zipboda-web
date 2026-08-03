import { MOCK_FEATURED_PRODUCTS } from "./__mocks__/featuredProducts.mock";
import type { Product } from "../model/types";

// TODO(API-070): fetch("/api/products")로 교체, mock 제거(A1)
export async function getFeaturedProducts(): Promise<Product[]> {
  return MOCK_FEATURED_PRODUCTS;
}
