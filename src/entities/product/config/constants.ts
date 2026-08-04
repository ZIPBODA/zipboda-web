import type { ShopSort } from "../model/types";

// figma 135:3377 가구 쇼핑 사이드바 필터
export const CATEGORY_OPTIONS = ["전체", "소파", "의자", "테이블", "조명", "수납", "침대"] as const;

export const DISCOUNT_OPTIONS: { label: string; value: number }[] = [
  { label: "전체", value: 0 },
  { label: "15%+", value: 15 },
  { label: "20%+", value: 20 },
  { label: "25%+", value: 25 }
];

export const SHOP_SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "POPULAR", label: "인기순" },
  { value: "PRICE_ASC", label: "가격 ↑" },
  { value: "PRICE_DESC", label: "가격 ↓" },
  { value: "RATING", label: "평점순" }
];

export const DEFAULT_SHOP_SORT: ShopSort = "POPULAR";
