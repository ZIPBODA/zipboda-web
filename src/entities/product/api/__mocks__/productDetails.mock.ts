import { MOCK_SHOP_PRODUCTS } from "./shopProducts.mock";
import type { ProductDetail } from "../../model/types";

/** 상품마다 준비된 사진 장수. 상세 갤러리가 이 수만큼 썸네일을 그린다 */
const SHOT_COUNT: Record<string, number> = { s1: 2, s2: 2, s3: 3, s4: 3, s5: 3, s6: 3, s7: 3, s8: 3 };

const shotsOf = (id: string) => Array.from({ length: SHOT_COUNT[id] ?? 1 }, (_, i) => `/mock/shop/${id}-${i + 1}.webp`);

// figma 135:3933~3936 색상 스와치(전 상품 공통 mock)
const COLORS = ["#D4C5A9", "#8BA3A0", "#C4956A", "#1A1A1A"];

// figma 135:3872 상세 — 평점·설명(린넨 침대 프레임=Figma 확정, 나머지 mock)
const EXTRAS: Record<string, { rating: number; description: string }> = {
  s1: { rating: 4.8, description: "곡선 프레임과 부클레 패브릭의 라운지 체어. 서재·거실 어디에나 어울리는 미니멀 실루엣." },
  s2: { rating: 4.9, description: "패딩 린넨 헤드보드의 로우 플랫폼 침대. 소나무 원목 슬랫 베이스, 박스 스프링 불필요. 퀸/킹 사이즈." },
  s3: { rating: 4.7, description: "포근한 3인 소파. 고밀도 폼 쿠션과 원목 다리로 편안함과 내구성을 모두 잡았습니다." },
  s4: { rating: 4.8, description: "부클레 원단의 라운드 암체어. 공간에 감각적인 포인트를 더합니다." },
  s5: { rating: 4.9, description: "아치형 실루엣의 플로어 램프. 따뜻한 간접 조명으로 분위기를 완성합니다." },
  s6: { rating: 4.7, description: "군더더기 없는 라인의 액센트 체어. 어느 공간에나 자연스럽게 어울립니다." },
  s7: { rating: 4.8, description: "4~6인 원목 다이닝 테이블. 견고한 상판과 안정적인 구조." },
  s8: { rating: 4.9, description: "개방형 선반 유닛. 책과 소품 디스플레이에 최적화된 수납." }
};

export const MOCK_PRODUCT_DETAILS: Record<string, ProductDetail> = Object.fromEntries(
  MOCK_SHOP_PRODUCTS.map((p) => [
    p.id,
    { ...p, rating: EXTRAS[p.id].rating, reviewCount: p.reviewCount ?? 0, inStock: true, colors: COLORS, images: shotsOf(p.id), description: EXTRAS[p.id].description }
  ])
);
