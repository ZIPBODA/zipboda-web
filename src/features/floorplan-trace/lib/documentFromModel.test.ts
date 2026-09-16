import { describe, it, expect } from "vitest";
import type { FloorplanModel2D } from "@/entities/floorplan";
import { documentFromModel } from "./documentFromModel";
import { createProjection } from "./projection";

const rect = (x: number, z: number, w: number, d: number) => [
  { x, z },
  { x: x + w, z },
  { x: x + w, z: z + d },
  { x, z: z + d }
];

// 자동 추출 결과를 흉내낸다: 뒤집힌 벽, 격자에서 벗어난 좌표, 40mm 모자란 칸막이, 문 하나
const draft = (): FloorplanModel2D => ({
  scale: { mmPerPx: 10, source: "dimension-chain" },
  outline: rect(0, 0, 4500, 6000),
  rooms: [
    { id: "room-0", label: "욕실", polygon: rect(0, 0, 2000, 6000) },
    { id: "room-1", label: "기타", polygon: rect(2000, 0, 2500, 6000) }
  ],
  walls: [
    { id: "top", a: { x: 4500, z: 0 }, b: { x: 0, z: 0 }, thicknessMm: 200, exterior: true },
    { id: "right", a: { x: 4500, z: 0 }, b: { x: 4500, z: 6000 }, thicknessMm: 200, exterior: true },
    { id: "bottom", a: { x: 0, z: 6000 }, b: { x: 4500, z: 6000 }, thicknessMm: 200, exterior: true },
    { id: "left", a: { x: 0, z: 0 }, b: { x: 0, z: 6000 }, thicknessMm: 200, exterior: true },
    { id: "div", a: { x: 2010, z: 40 }, b: { x: 2010, z: 6000 }, thicknessMm: 100, exterior: false }
  ],
  openings: [{ wallId: "top", type: "door", offsetMm: 500, widthMm: 900 }],
  printed: { exclusiveAreaM2: 27, dimensionChains: [{ axis: "x", values: [4500] }] },
  confidence: { overall: 0.8, perRoom: {} }
});

describe("documentFromModel", () => {
  const originPx = { x: 120, y: 80 };

  it("캘리브레이션은 크롭 좌상단과 모델 스케일에서 온다 — 기존 오버레이와 같은 자리에 겹친다", () => {
    const document = documentFromModel(draft(), originPx);
    const projection = createProjection(document.calibration);
    expect(projection?.toPx({ x: 4500, z: 6000 })).toEqual({ x: 120 + 450, y: 80 + 600 });
  });

  it("벽은 격자에 맞추고 a ≤ b로 돌리며 모자란 끝점은 붙인다", () => {
    const { walls } = documentFromModel(draft(), originPx);
    expect(walls).toHaveLength(5);
    const top = walls[0];
    expect(top.a).toEqual({ x: 0, z: 0 });
    expect(top.b).toEqual({ x: 4500, z: 0 });
    const divider = walls[4];
    expect(divider.a).toEqual({ x: 2000, z: 0 });
    expect(divider.b).toEqual({ x: 2000, z: 6000 });
  });

  it("뒤집힌 벽의 문 offset을 새 a 기준으로 바꾸고 새 wallId를 단다", () => {
    const { walls, openings } = documentFromModel(draft(), originPx);
    expect(openings).toHaveLength(1);
    expect(openings[0].wallId).toBe(walls[0].id);
    // 원래 a=(4500,0)에서 500 → 문 중심 x = 4500 − 950 = 3550 → 새 a=(0,0) 기준 offset 3100
    expect(openings[0].offsetMm).toBe(3100);
  });

  it("기타가 아닌 방만 무게중심 앵커가 된다", () => {
    const { labelAnchors } = documentFromModel(draft(), originPx);
    expect(labelAnchors).toEqual([{ id: expect.any(String), at: { x: 1000, z: 3000 }, label: "욕실" }]);
  });

  it("벽 없이 나뉜 방 경계는 경계선(두께 0) 하나로 옮기고, 벽이 덮는 변은 만들지 않는다", () => {
    // 오른쪽 방을 z=3000에서 둘로 나눈 색 경계 — 두 방이 같은 변을 공유하지만 벽은 없다
    const model = draft();
    model.rooms = [
      model.rooms[0],
      { id: "room-1", label: "주방", polygon: rect(2000, 0, 2500, 3000) },
      { id: "room-2", label: "거실", polygon: rect(2000, 3000, 2500, 3000) }
    ];
    const { walls } = documentFromModel(model, originPx);
    const boundaries = walls.filter((wall) => wall.thicknessMm === 0);
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0]).toMatchObject({ a: { x: 2000, z: 3000 }, b: { x: 4500, z: 3000 } });
  });

  it("id는 중복 없이 발급된다", () => {
    const { walls, openings, labelAnchors, seq } = documentFromModel(draft(), originPx);
    const ids = [...walls, ...openings, ...labelAnchors].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(seq).toBe(ids.length);
  });
});
