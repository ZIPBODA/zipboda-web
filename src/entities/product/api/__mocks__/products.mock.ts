import type { Product } from "../../model/types";

// figma 135:5208 '이 공간 꾸미기' 추천 가구. TODO: 추천 API 미정의 — 계약 확정 후 mock 제거(A1·A3)
export const MOCK_RECOMMENDED_PRODUCTS: Product[] = [
  { id: "p1", brand: "바움 스튜디오", name: "노르딕 3인 소파", price: 1280000 },
  { id: "p2", brand: "폼 스튜디오", name: "메소 액센트 체어", price: 485000 },
  { id: "p3", brand: "루네 오브제", name: "할로 라운지 체어", price: 398000 }
];
