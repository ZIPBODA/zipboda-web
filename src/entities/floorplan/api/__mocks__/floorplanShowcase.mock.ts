import type { FloorplanShowcase } from "../../model/types";

// figma 135:7297 메인 대표 평면도 3건. TODO(API-031): 실 API 연동 시 mock 전량 제거(A1)
export const MOCK_FLOORPLAN_SHOWCASE: FloorplanShowcase[] = [
  { id: "fp-84a", size: 84, type: "A", summary: "방3 · 화장실2 · 거실/식당 통합", has2d: true, has3d: true, image: "/mock/main/main-interactive-1.png" },
  { id: "fp-59b", size: 59, type: "B", summary: "방2 · 화장실1 · 오픈 키친", has2d: true, has3d: true, image: "/mock/main/main-interactive-2.png" },
  { id: "fp-39c", size: 39, type: "C", summary: "방1 · 화장실1 · 원룸", has2d: true, has3d: true, image: "/mock/main/main-interactive-3.png" }
];
