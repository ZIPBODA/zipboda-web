import type { Floorplan, FloorplanModel2D, PointMm } from "../../model/types";

const rect = (x: number, z: number, w: number, d: number): PointMm[] => [
  { x, z },
  { x: x + w, z },
  { x: x + w, z: z + d },
  { x, z: z + d }
];

// LH 33㎡ 실속평면(public/mock/test2.jpg) 인쇄 치수 그대로 작성 — 폭 4500(1100/1670/1730), 깊이 8740(1280/3950/3510)+발코니 1300.
// 검수 화면(/dev/floorplan-review)이 내보내는 JSON과 동일한 스키마. TODO(API-031): 실 API 연동 시 mock 전량 제거(A1)
const LH_33_MODEL: FloorplanModel2D = {
  scale: { mmPerPx: 16.7, source: "dimension-chain" },
  outline: rect(0, 0, 4500, 10040),
  rooms: [
    // 좌측 1100 구간(신발장·PD)은 현관에 포함 — 인쇄 전용면적(1.99㎡)은 표 값 그대로 사용
    { id: "entrance", label: "현관", polygon: rect(0, 0, 2770, 1280), areaM2: 1.99 },
    { id: "bath", label: "욕실", polygon: rect(2770, 0, 1730, 1830), areaM2: 3.17 },
    { id: "closet", label: "반침", polygon: rect(2770, 1830, 1730, 610), areaM2: 1.06 },
    {
      id: "kitchen",
      label: "주방",
      polygon: [
        { x: 0, z: 1280 },
        { x: 2770, z: 1280 },
        { x: 2770, z: 2440 },
        { x: 4500, z: 2440 },
        { x: 4500, z: 5230 },
        { x: 0, z: 5230 }
      ],
      areaM2: 13.71
    },
    { id: "living", label: "거실", polygon: rect(0, 5230, 4500, 3510), areaM2: 13.63 },
    { id: "balcony", label: "발코니", polygon: rect(0, 8740, 4500, 1300), areaM2: 6.67 }
  ],
  walls: [
    { id: "ext-top", a: { x: 0, z: 0 }, b: { x: 4500, z: 0 }, thicknessMm: 200, exterior: true },
    { id: "ext-right", a: { x: 4500, z: 0 }, b: { x: 4500, z: 10040 }, thicknessMm: 200, exterior: true },
    { id: "ext-bottom", a: { x: 0, z: 10040 }, b: { x: 4500, z: 10040 }, thicknessMm: 200, exterior: true },
    { id: "ext-left", a: { x: 0, z: 0 }, b: { x: 0, z: 10040 }, thicknessMm: 200, exterior: true },
    { id: "bath-left", a: { x: 2770, z: 0 }, b: { x: 2770, z: 2440 }, thicknessMm: 100, exterior: false },
    { id: "bath-bottom", a: { x: 2770, z: 1830 }, b: { x: 4500, z: 1830 }, thicknessMm: 100, exterior: false },
    { id: "closet-bottom", a: { x: 2770, z: 2440 }, b: { x: 4500, z: 2440 }, thicknessMm: 100, exterior: false },
    { id: "kitchen-living", a: { x: 0, z: 5230 }, b: { x: 4500, z: 5230 }, thicknessMm: 100, exterior: false },
    { id: "living-balcony", a: { x: 0, z: 8740 }, b: { x: 4500, z: 8740 }, thicknessMm: 100, exterior: false }
  ],
  openings: [
    { wallId: "ext-top", type: "door", offsetMm: 1500, widthMm: 900, swing: "in" },
    { wallId: "bath-left", type: "door", offsetMm: 500, widthMm: 800, swing: "in" },
    { wallId: "closet-bottom", type: "door", offsetMm: 200, widthMm: 1300 },
    { wallId: "kitchen-living", type: "door", offsetMm: 300, widthMm: 3900 },
    { wallId: "living-balcony", type: "door", offsetMm: 1100, widthMm: 3000 },
    { wallId: "ext-bottom", type: "window", offsetMm: 1000, widthMm: 3400 }
  ],
  fixtures: [
    { type: "sink", roomId: "bath", polygon: rect(2900, 100, 600, 500) },
    { type: "toilet", roomId: "bath", polygon: rect(4000, 1000, 400, 700) },
    { type: "kitchen", roomId: "kitchen", polygon: rect(0, 1280, 600, 2500) }
  ],
  printed: {
    exclusiveAreaM2: 33.56,
    dimensionChains: [
      { axis: "x", values: [1100, 1670, 1730] },
      { axis: "x", values: [1000, 3500] },
      { axis: "z", values: [1280, 3950, 3260, 1550] },
      { axis: "z", values: [5230, 3510, 1300] }
    ]
  },
  confidence: {
    overall: 1,
    perRoom: { entrance: 1, bath: 1, closet: 1, kitchen: 1, living: 1, balcony: 1 }
  }
};

// figma 135:5097 평면도 방별 치수. TODO(API-031): 실 API 연동 시 mock 전량 제거(A1)
export const MOCK_FLOORPLANS: Floorplan[] = [
  {
    id: "fp-84a",
    subscriptionId: "1",
    size: 84,
    type: "A",
    has3d: true,
    image2dUrl: "/mock/floorplans/fp-test2.png",
    rooms: [
      { name: "거실 / 식당", dimensions: "5.2 × 4.8m", area: "24.96㎡" },
      { name: "안방", dimensions: "5.2 × 3.7m", area: "19.24㎡" },
      { name: "주방", dimensions: "5.4 × 3.2m", area: "17.28㎡" },
      { name: "침실 2", dimensions: "3.1 × 3.2m", area: "9.92㎡" },
      { name: "침실 3", dimensions: "5.4 × 2.0m", area: "10.80㎡" },
      { name: "욕실 ×2", dimensions: "2.2 × 2.0m", area: "8.80㎡" }
    ],
    model2d: LH_33_MODEL
  }
];
