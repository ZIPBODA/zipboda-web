import { MOCK_SHOP_PRODUCTS } from "./__mocks__/shopProducts.mock";
import { DEFAULT_SHOP_SORT } from "../config/constants";
import type { Product, ShopProductFilter, ShopSort } from "../model/types";

const SORTERS: Record<ShopSort, (a: Product, b: Product) => number> = {
  POPULAR: (a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
  PRICE_ASC: (a, b) => a.price - b.price,
  PRICE_DESC: (a, b) => b.price - a.price,
  RATING: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
};

// TODO(API): GET /api/products로 교체, mock 제거(A1)
export async function getShopProducts(filter?: Partial<ShopProductFilter>): Promise<Product[]> {
  const category = filter?.category ?? "전체";
  const discount = filter?.discount ?? 0;
  const sort = filter?.sort ?? DEFAULT_SHOP_SORT;

  let list = [...MOCK_SHOP_PRODUCTS];
  if (category !== "전체") list = list.filter((p) => p.category === category);
  if (discount > 0) list = list.filter((p) => (p.discountRate ?? 0) >= discount);

  return list.sort(SORTERS[sort] ?? SORTERS[DEFAULT_SHOP_SORT]);
}
