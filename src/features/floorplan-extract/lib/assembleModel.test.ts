import { describe, it, expect } from "vitest";
import { assembleModel } from "./assembleModel";
import type { AssembleInput } from "./assembleModel";

// 450×600px 크롭, 10mm/px → 4.5m × 6m. 좌·우 두 방, 외곽 4벽 + 중앙 세로 벽
const input = (): AssembleInput => ({
  crop: { x: 100, y: 50, width: 450, height: 600 },
  mmPerPx: 10,
  chainMm: [2000, 2500],
  exclusiveAreaM2: 27,
  segments: [
    { a: { x: 0, y: 1 }, b: { x: 449, y: 1 }, thicknessPx: 3 },
    { a: { x: 448, y: 0 }, b: { x: 448, y: 599 }, thicknessPx: 3 },
    { a: { x: 0, y: 598 }, b: { x: 449, y: 598 }, thicknessPx: 3 },
    { a: { x: 1, y: 0 }, b: { x: 1, y: 599 }, thicknessPx: 3 },
    { a: { x: 200, y: 3 }, b: { x: 200, y: 596 }, thicknessPx: 2 }
  ],
  regions: [
    { id: "region-0", bbox: { minX: 3, minY: 3, maxX: 198, maxY: 596 }, areaPx: 1, touchesBorder: false },
    { id: "region-1", bbox: { minX: 202, minY: 3, maxX: 446, maxY: 596 }, areaPx: 1, touchesBorder: false }
  ],
  labels: { "region-0": { label: "거실", confidence: 1 }, "region-1": { label: "침실", confidence: 0.75 } }
});

describe("assembleModel", () => {
  it("크롭 크기를 실척 외곽으로 환산한다", () => {
    const model = assembleModel(input());
    expect(model.outline).toEqual([
      { x: 0, z: 0 },
      { x: 4500, z: 0 },
      { x: 4500, z: 6000 },
      { x: 0, z: 6000 }
    ]);
  });

  it("방 영역 bbox를 mm 사각형 폴리곤과 라벨로 변환한다", () => {
    const model = assembleModel(input());
    expect(model.rooms).toHaveLength(2);
    expect(model.rooms[0]).toMatchObject({ id: "room-0", label: "거실" });
    expect(model.rooms[0].polygon[0]).toEqual({ x: 30, z: 30 });
    expect(model.rooms[0].polygon[2]).toEqual({ x: 1990, z: 5970 });
    expect(model.rooms[1].label).toBe("침실");
  });

  it("크롭 가장자리 세그먼트는 외벽, 내부 세그먼트는 내벽으로 표시한다", () => {
    const model = assembleModel(input());
    const exterior = model.walls.filter((w) => w.exterior);
    const interior = model.walls.filter((w) => !w.exterior);
    expect(exterior).toHaveLength(4);
    expect(interior).toHaveLength(1);
    expect(interior[0]).toMatchObject({ a: { x: 2000, z: 30 }, b: { x: 2000, z: 5960 }, thicknessMm: 20 });
  });

  it("치수 체인이 있으면 scale.source를 dimension-chain으로, 인쇄 정보를 기록한다", () => {
    const model = assembleModel(input());
    expect(model.scale).toEqual({ mmPerPx: 10, source: "dimension-chain" });
    expect(model.printed).toEqual({ exclusiveAreaM2: 27, dimensionChains: [{ axis: "x", values: [2000, 2500] }] });
  });

  it("체인이 단일 값이면 estimated로 표시하고 체인을 기록하지 않는다", () => {
    const model = assembleModel({ ...input(), chainMm: [4500] });
    expect(model.scale.source).toBe("estimated");
    expect(model.printed.dimensionChains).toEqual([]);
  });

  it("라벨이 없는 영역은 기타·신뢰도 0으로 채운다", () => {
    const model = assembleModel({ ...input(), labels: {} });
    expect(model.rooms.every((r) => r.label === "기타")).toBe(true);
    expect(model.confidence.perRoom).toEqual({ "room-0": 0, "room-1": 0 });
  });
});
