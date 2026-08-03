import type { Floorplan } from "../../model/types";

// figma 135:5097 평면도 방별 치수. TODO(API-031): 실 API 연동 시 mock 전량 제거(A1)
export const MOCK_FLOORPLANS: Floorplan[] = [
  {
    id: "fp-84a",
    subscriptionId: "1",
    size: 84,
    type: "A",
    has3d: true,
    rooms: [
      { name: "거실 / 식당", dimensions: "5.2 × 4.8m", area: "24.96㎡" },
      { name: "안방", dimensions: "5.2 × 3.7m", area: "19.24㎡" },
      { name: "주방", dimensions: "5.4 × 3.2m", area: "17.28㎡" },
      { name: "침실 2", dimensions: "3.1 × 3.2m", area: "9.92㎡" },
      { name: "침실 3", dimensions: "5.4 × 2.0m", area: "10.80㎡" },
      { name: "욕실 ×2", dimensions: "2.2 × 2.0m", area: "8.80㎡" }
    ]
  }
];
