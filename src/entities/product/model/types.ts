export interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  /** 할인 전 가격·할인율·평점은 커머스 목록(메인 '인기 가구'·가구 쇼핑)에서만 노출된다 */
  originalPrice?: number;
  discountRate?: number;
  rating?: number;
  reviewCount?: number;
  /** 가구 쇼핑 목록의 카테고리 태그(소파/의자/…). 홈 추천에는 없음 */
  category?: string;
}

export type ShopSort = "POPULAR" | "PRICE_ASC" | "PRICE_DESC" | "RATING";

export interface ShopProductFilter {
  category: string;
  discount: number;
  sort: ShopSort;
}

export interface ProductDetail extends Product {
  rating: number;
  reviewCount: number;
  inStock: boolean;
  /** 색상 스와치(hex) */
  colors: string[];
  description: string;
}
