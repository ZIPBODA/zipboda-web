import { describe, it, expect } from "vitest";
import { normalizeModel } from "@/entities/floorplan";
import { assembleModel, type AssembleInput } from "./assembleModel";

// 450×600px 크롭(10mm/px = 4.5×6m). 좌=현관, 우=거실. 중앙 세로 벽에 문 900mm
const twoRoomWithDoor = (): AssembleInput => ({
  crop: { x: 0, y: 0, width: 450, height: 600 },
  mmPerPx: 10,
  scaleSource: "dimension-chain",
  chainMm: [2000, 2500],
  segments: [
    { a: { x: 0, y: 1 }, b: { x: 449, y: 1 }, thicknessPx: 3 },
    { a: { x: 448, y: 0 }, b: { x: 448, y: 599 }, thicknessPx: 3 },
    { a: { x: 0, y: 598 }, b: { x: 449, y: 598 }, thicknessPx: 3 },
    { a: { x: 1, y: 0 }, b: { x: 1, y: 599 }, thicknessPx: 3 },
    // 중앙 벽 — y 300~389px 구간이 문
    { a: { x: 200, y: 3 }, b: { x: 200, y: 299 }, thicknessPx: 2 },
    { a: { x: 200, y: 390 }, b: { x: 200, y: 596 }, thicknessPx: 2 }
  ],
  regions: [
    { id: "region-0", bbox: { minX: 3, minY: 3, maxX: 198, maxY: 596 }, polygon: [], areaPx: 1, touchesBorder: false },
    { id: "region-1", bbox: { minX: 202, minY: 3, maxX: 446, maxY: 596 }, polygon: [], areaPx: 1, touchesBorder: false }
  ],
  labels: { "region-0": { label: "현관", confidence: 1 }, "region-1": { label: "거실", confidence: 1 } }
});

describe("추출 조립 → 정규화 파이프라인", () => {
  it("문이 검출되면 no-doors 플래그가 사라진다", () => {
    const result = normalizeModel(assembleModel(twoRoomWithDoor()));
    expect(result.flags.map((f) => f.code)).not.toContain("no-doors");
  });

  it("문이 없으면 no-doors 플래그로 검수를 유도한다", () => {
    const input = twoRoomWithDoor();
    // 중앙 벽을 문 없이 이어 붙인다
    input.segments = input.segments.filter((s) => !(s.a.x === 200 && s.b.x === 200));
    input.segments.push({ a: { x: 200, y: 3 }, b: { x: 200, y: 596 }, thicknessPx: 2 });
    const result = normalizeModel(assembleModel(input));
    expect(result.flags.map((f) => f.code)).toContain("no-doors");
  });

  it("검출된 개구부는 정규화 후에도 소속 벽 위에 남는다", () => {
    const result = normalizeModel(assembleModel(twoRoomWithDoor()));
    expect(result.flags.map((f) => f.code)).not.toContain("opening-invalid");
    expect(result.model.openings.length).toBeGreaterThan(0);
  });
});
