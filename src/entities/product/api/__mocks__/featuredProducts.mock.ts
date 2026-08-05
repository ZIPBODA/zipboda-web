import type { Product } from "../../model/types";

// figma 135:7380 메인 '인기 가구 추천' 8건. TODO(API-070): 실 API 연동 시 mock 전량 제거(A1)
export const MOCK_FEATURED_PRODUCTS: Product[] = [
  { id: "f1", brand: "바움 스튜디오", name: "노르딕 3인 소파", price: 1280000, originalPrice: 1780000, discountRate: 28, rating: 5, reviewCount: 342, image: "/mock/main/main-furniture-1.png" },
  { id: "f2", brand: "폼 스튜디오", name: "메소 액센트 체어", price: 485000, originalPrice: 620000, discountRate: 22, rating: 5, reviewCount: 187, image: "/mock/main/main-furniture-2.png" },
  { id: "f3", brand: "루네 오브제", name: "할로 라운지 체어", price: 398000, originalPrice: 520000, discountRate: 23, rating: 5, reviewCount: 521, image: "/mock/main/main-furniture-3.png" },
  { id: "f4", brand: "벨라 하우스", name: "부클레 암체어", price: 680000, originalPrice: 860000, discountRate: 21, rating: 5, reviewCount: 298, image: "/mock/main/main-furniture-4.png" },
  { id: "f5", brand: "벨라 하우스", name: "미니멀 다이닝 테이블", price: 980000, originalPrice: 1200000, discountRate: 18, rating: 5, reviewCount: 178, image: "/mock/main/main-furniture-5.png" },
  { id: "f6", brand: "루네 오브제", name: "아크 플로어 램프", price: 290000, originalPrice: 380000, discountRate: 24, rating: 5, reviewCount: 203, image: "/mock/main/main-furniture-6.png" },
  { id: "f7", brand: "바움 스튜디오", name: "오픈 선반 유닛", price: 560000, originalPrice: 720000, discountRate: 22, rating: 5, reviewCount: 134, image: "/mock/main/main-furniture-7.png" },
  { id: "f8", brand: "폼 스튜디오", name: "린넨 침대 프레임", price: 1450000, originalPrice: 1900000, discountRate: 24, rating: 5, reviewCount: 412, image: "/mock/main/main-furniture-8.png" }
];
