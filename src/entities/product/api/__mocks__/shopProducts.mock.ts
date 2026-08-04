import type { Product } from "../../model/types";

// figma 135:3431~ 가구 쇼핑 8건. TODO(API): 상품 목록 API 연동 시 mock 제거(A1)
export const MOCK_SHOP_PRODUCTS: Product[] = [
  { id: "s1", brand: "루네 오브제", name: "할로 라운지 체어", category: "의자", price: 398000, originalPrice: 520000, discountRate: 23, rating: 5, reviewCount: 521 },
  { id: "s2", brand: "폼 스튜디오", name: "린넨 침대 프레임", category: "침대", price: 1450000, originalPrice: 1900000, discountRate: 24, rating: 5, reviewCount: 412 },
  { id: "s3", brand: "바움 스튜디오", name: "노르딕 3인 소파", category: "소파", price: 1280000, originalPrice: 1780000, discountRate: 28, rating: 5, reviewCount: 342 },
  { id: "s4", brand: "벨라 하우스", name: "부클레 암체어", category: "의자", price: 680000, originalPrice: 860000, discountRate: 21, rating: 5, reviewCount: 298 },
  { id: "s5", brand: "루네 오브제", name: "아크 플로어 램프", category: "조명", price: 290000, originalPrice: 380000, discountRate: 24, rating: 5, reviewCount: 203 },
  { id: "s6", brand: "폼 스튜디오", name: "메소 액센트 체어", category: "의자", price: 485000, originalPrice: 620000, discountRate: 22, rating: 5, reviewCount: 187 },
  { id: "s7", brand: "벨라 하우스", name: "미니멀 다이닝 테이블", category: "테이블", price: 980000, originalPrice: 1200000, discountRate: 18, rating: 5, reviewCount: 178 },
  { id: "s8", brand: "바움 스튜디오", name: "오픈 선반 유닛", category: "수납", price: 560000, originalPrice: 720000, discountRate: 22, rating: 5, reviewCount: 134 }
];
