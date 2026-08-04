import { MOCK_PRODUCT_DETAILS } from "./__mocks__/productDetails.mock";
import type { ProductDetail } from "../model/types";

// TODO(API): GET /api/products/{id}로 교체, mock 제거(A1)
export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  return MOCK_PRODUCT_DETAILS[id] ?? null;
}
