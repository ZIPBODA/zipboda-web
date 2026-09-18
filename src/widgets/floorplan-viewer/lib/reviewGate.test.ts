import { describe, it, expect } from "vitest";
import type { FloorplanModel2D } from "@/entities/floorplan";
import { evaluateModelFor3d } from "./reviewGate";

const rect = (x: number, z: number, w: number, d: number) => [
  { x, z },
  { x: x + w, z },
  { x: x + w, z: z + d },
  { x, z: z + d },
];

// 4500×6000 두 방(현관·거실) + 외벽 4 + 칸막이 + 문 2 — normalize 테스트의 정합 모델과 같은 구성
const sound = (): FloorplanModel2D => ({
  scale: { mmPerPx: 10, source: "estimated" },
  outline: rect(0, 0, 4500, 6000),
  rooms: [
    { id: "r-entrance", label: "현관", polygon: rect(0, 0, 4500, 1500) },
    { id: "r-living", label: "거실", polygon: rect(0, 1500, 4500, 4500) },
  ],
  walls: [
    {
      id: "top",
      a: { x: 0, z: 0 },
      b: { x: 4500, z: 0 },
      thicknessMm: 150,
      exterior: true,
    },
    {
      id: "right",
      a: { x: 4500, z: 0 },
      b: { x: 4500, z: 6000 },
      thicknessMm: 150,
      exterior: true,
    },
    {
      id: "bottom",
      a: { x: 0, z: 6000 },
      b: { x: 4500, z: 6000 },
      thicknessMm: 150,
      exterior: true,
    },
    {
      id: "left",
      a: { x: 0, z: 0 },
      b: { x: 0, z: 6000 },
      thicknessMm: 150,
      exterior: true,
    },
    {
      id: "hall",
      a: { x: 0, z: 1500 },
      b: { x: 4500, z: 1500 },
      thicknessMm: 100,
      exterior: false,
    },
  ],
  openings: [
    { wallId: "top", type: "door", offsetMm: 1800, widthMm: 900 },
    { wallId: "hall", type: "door", offsetMm: 1800, widthMm: 900 },
  ],
  printed: { exclusiveAreaM2: 27, dimensionChains: [] },
  confidence: { overall: 0, perRoom: {} },
});

describe("evaluateModelFor3d", () => {
  it("정합한 모델은 reviewed — 치수 체인 없음은 허용한다", () => {
    const verdict = evaluateModelFor3d(sound());
    expect(verdict.status).toBe("reviewed");
    expect(verdict.reasons).toEqual([]);
    expect(verdict.scene?.walls.length).toBeGreaterThan(0);
    expect(verdict.areaDeviation).toBeCloseTo(0);
  });

  it("문이 없으면 needs-review이고 이유가 남는다", () => {
    const model = sound();
    model.openings = [];
    const verdict = evaluateModelFor3d(model);
    expect(verdict.status).toBe("needs-review");
    expect(verdict.reasons.join(" ")).toContain("문 없음");
  });

  it("전용면적이 안목 환산값과 방 합 사이면 편차 0으로 본다", () => {
    // 4500×6000 중심선 27㎡, 외벽 150 → 안목 환산 27 − (21000×75)/1e6 = 25.425㎡
    const model = sound();
    model.printed.exclusiveAreaM2 = 25.6;
    const verdict = evaluateModelFor3d(model);
    expect(verdict.areaDeviation).toBe(0);
    expect(verdict.status).toBe("reviewed");
  });

  it("발코니를 읽은 모델에서 전용면적이 안목 환산값보다 5% 넘게 작으면 needs-review", () => {
    const model = sound();
    model.rooms.push({
      id: "r-balcony",
      label: "발코니",
      polygon: rect(0, 6000, 4500, 1300),
    });
    model.outline = rect(0, 0, 4500, 7300);
    model.walls = model.walls.map((wall) =>
      wall.id === "bottom" ? { ...wall, exterior: false } : wall,
    );
    model.walls.push(
      {
        id: "b-left",
        a: { x: 0, z: 6000 },
        b: { x: 0, z: 7300 },
        thicknessMm: 150,
        exterior: true,
      },
      {
        id: "b-right",
        a: { x: 4500, z: 6000 },
        b: { x: 4500, z: 7300 },
        thicknessMm: 150,
        exterior: true,
      },
      {
        id: "b-bottom",
        a: { x: 0, z: 7300 },
        b: { x: 4500, z: 7300 },
        thicknessMm: 150,
        exterior: true,
      },
    );
    model.printed.exclusiveAreaM2 = 23;
    const verdict = evaluateModelFor3d(model);
    expect(verdict.status).toBe("needs-review");
    expect(verdict.reasons.join(" ")).toContain("면적 편차");
  });

  it("전용면적과 5% 넘게 어긋나면 needs-review", () => {
    const model = sound();
    model.printed.exclusiveAreaM2 = 40;
    const verdict = evaluateModelFor3d(model);
    expect(verdict.status).toBe("needs-review");
    expect(verdict.reasons.join(" ")).toContain("면적 편차");
  });

  it("벽이 셋 이하면 외곽이 닫히지 않은 것이라 needs-review", () => {
    const model = sound();
    model.walls = model.walls.slice(0, 3);
    model.openings = model.openings.filter((o) =>
      model.walls.some((w) => w.id === o.wallId),
    );
    expect(evaluateModelFor3d(model).reasons.join(" ")).toContain("벽 3개");
  });

  it("교차하는 방 폴리곤(기하 결함)은 blocked", () => {
    const model = sound();
    model.rooms[0].polygon = [
      { x: 0, z: 0 },
      { x: 4500, z: 0 },
      { x: 0, z: 1500 },
      { x: 4500, z: 1500 },
    ];
    const verdict = evaluateModelFor3d(model);
    expect(verdict.status).toBe("blocked");
    expect(verdict.scene).toBeNull();
  });
});
