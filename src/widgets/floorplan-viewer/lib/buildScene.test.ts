import { describe, it, expect } from "vitest";
import type { FloorplanModel2D } from "@/entities/floorplan";
import { buildScene, clampWallsToHeight, solidSpans, yawTowards } from "./buildScene";

const rect = (x: number, z: number, w: number, d: number) => [
  { x, z },
  { x: x + w, z },
  { x: x + w, z: z + d },
  { x, z: z + d }
];

// 4000×6000 유닛, 상단 외벽(길이 4m)에 문 1개(1.0~1.9m 구간)
const baseModel = (): FloorplanModel2D => ({
  scale: { mmPerPx: 10, source: "dimension-chain" },
  outline: rect(0, 0, 4000, 6000),
  rooms: [{ id: "room-0", label: "거실", polygon: rect(0, 0, 4000, 6000) }],
  walls: [{ id: "w-top", a: { x: 0, z: 0 }, b: { x: 4000, z: 0 }, thicknessMm: 150, exterior: true }],
  openings: [{ wallId: "w-top", type: "door", offsetMm: 1000, widthMm: 900 }],
  printed: { dimensionChains: [] },
  confidence: { overall: 1, perRoom: {} }
});

describe("solidSpans", () => {
  it("개구부를 뺀 벽 구간을 돌려준다", () => {
    expect(solidSpans(4, [{ start: 1, end: 1.9 }])).toEqual([
      { start: 0, end: 1 },
      { start: 1.9, end: 4 }
    ]);
  });

  it("겹치는 개구부와 범위 밖 값을 정리한다", () => {
    expect(solidSpans(4, [{ start: 3.5, end: 5 }, { start: 1, end: 2 }, { start: 1.5, end: 2.5 }])).toEqual([
      { start: 0, end: 1 },
      { start: 2.5, end: 3.5 }
    ]);
  });

  it("개구부가 없으면 전체가 한 구간", () => {
    expect(solidSpans(4, [])).toEqual([{ start: 0, end: 4 }]);
  });
});

describe("clampWallsToHeight", () => {
  it("컷 높이 위 인방은 제거하고 실벽은 컷 높이까지만 남긴다", () => {
    const scene = buildScene(baseModel());
    const clamped = clampWallsToHeight(scene.walls, 1.2);
    expect(clamped).toHaveLength(2);
    for (const w of clamped) {
      expect(w.height).toBeCloseTo(1.2);
      expect(w.yCenter).toBeCloseTo(0.6);
    }
  });
});

describe("yawTowards", () => {
  it("-z(도면 위쪽)를 바라보면 yaw 0, +z를 바라보면 π", () => {
    expect(yawTowards(0, -1)).toBeCloseTo(0);
    expect(Math.abs(yawTowards(0, 1))).toBeCloseTo(Math.PI);
  });

  it("+x(오른쪽)를 바라보면 -π/2", () => {
    expect(yawTowards(1, 0)).toBeCloseTo(-Math.PI / 2);
  });
});

describe("buildScene", () => {
  it("외곽을 미터·중앙 원점으로 환산한다", () => {
    const scene = buildScene(baseModel());
    expect(scene.widthM).toBe(4);
    expect(scene.depthM).toBe(6);
    expect(scene.floors[0].polygon[0]).toEqual({ x: -2, z: -3 });
    expect(scene.floors[0].polygon[2]).toEqual({ x: 2, z: 3 });
    expect(scene.floors[0].color).toBeTruthy();
  });

  it("문이 있는 벽은 좌·우 실벽 2개 + 문 위 인방 1개로 분할된다", () => {
    const scene = buildScene(baseModel());
    expect(scene.walls).toHaveLength(3);
    const fullHeight = scene.walls.filter((w) => w.height === 2.4);
    const lintel = scene.walls.find((w) => w.height < 2.4);
    expect(fullHeight).toHaveLength(2);
    expect(fullHeight.map((w) => w.length).sort((a, b) => a - b)).toEqual([1, 2.1]);
    expect(lintel?.length).toBeCloseTo(0.9);
    expect(lintel?.yCenter).toBeCloseTo((2.1 + 2.4) / 2);
    expect(lintel?.height).toBeCloseTo(0.3);
  });

  it("충돌 세그먼트는 문 구간을 제외한다(문 통과 가능)", () => {
    const scene = buildScene(baseModel());
    expect(scene.collision).toHaveLength(2);
    const lengths = scene.collision.map((s) => Math.hypot(s.x2 - s.x1, s.z2 - s.z1)).sort((a, b) => a - b);
    expect(lengths[0]).toBeCloseTo(1);
    expect(lengths[1]).toBeCloseTo(2.1);
  });

  it("창은 실 아래·인방 위 박스로 비우고 충돌에는 포함한다", () => {
    const model = baseModel();
    model.openings = [{ wallId: "w-top", type: "window", offsetMm: 1000, widthMm: 900 }];
    const scene = buildScene(model);
    const windowPieces = scene.walls.filter((w) => Math.abs(w.length - 0.9) < 1e-9);
    expect(windowPieces).toHaveLength(2);
    const heights = windowPieces.map((w) => w.height).sort((a, b) => a - b);
    expect(heights[0]).toBeCloseTo(0.3);
    expect(heights[1]).toBeCloseTo(0.9);
    expect(scene.collision).toHaveLength(3);
  });

  it("벽 박스의 각도는 세그먼트 방향을 따른다", () => {
    const model = baseModel();
    model.walls = [{ id: "w-left", a: { x: 0, z: 0 }, b: { x: 0, z: 6000 }, thicknessMm: 150, exterior: true }];
    model.openings = [];
    const [wall] = buildScene(model).walls;
    expect(wall.angleY).toBeCloseTo(Math.PI / 2);
    expect(wall.thickness).toBeCloseTo(0.15);
    expect(wall.length).toBe(6);
  });

  it("바닥 슬래브는 방 무게중심을 함께 담는다", () => {
    const scene = buildScene(baseModel());
    expect(scene.floors[0].center).toEqual({ x: 0, z: 0 });
  });

  it("현관이 없으면 외곽 중심에서 가장 큰 방을 바라보며 시작한다", () => {
    const scene = buildScene(baseModel());
    expect(scene.spawn.x).toBeCloseTo(0);
    expect(scene.spawn.z).toBeCloseTo(0);
  });

  it("현관이 있으면 현관 중심에서 가장 큰 방(거실)을 향해 시작한다", () => {
    const model = baseModel();
    model.rooms = [
      { id: "entrance", label: "현관", polygon: rect(1500, 0, 1000, 1000) },
      { id: "living", label: "거실", polygon: rect(0, 1000, 4000, 5000) }
    ];
    const scene = buildScene(model);
    expect(scene.spawn.x).toBeCloseTo(0);
    expect(scene.spawn.z).toBeCloseTo(-2.5);
    // 거실은 현관의 +z 방향 → three.js 전방 (-sin yaw, -cos yaw) = (0, +1) → yaw = π
    expect(Math.abs(scene.spawn.yaw)).toBeCloseTo(Math.PI);
  });

  it("설비 폴리곤을 높이가 지정된 박스로 변환한다", () => {
    const model = baseModel();
    model.fixtures = [{ type: "toilet", roomId: "room-0", polygon: rect(3000, 500, 400, 700) }];
    const [fixture] = buildScene(model).fixtures;
    expect(fixture).toMatchObject({ type: "toilet", width: 0.4, depth: 0.7, height: 0.4 });
    expect(fixture.cx).toBeCloseTo(1.2);
    expect(fixture.cz).toBeCloseTo(-2.15);
  });
});

describe("buildScene 라벨이 없는 도면", () => {
  /** 방 이름이 인쇄되지 않았거나 OCR이 못 읽어 전부 '기타'인 모델 */
  const unlabeled = (): FloorplanModel2D => {
    const model = baseModel();
    model.rooms = [
      { id: "small", label: "기타", polygon: rect(0, 0, 1000, 1000) },
      { id: "big", label: "기타", polygon: rect(0, 1000, 4000, 4000) }
    ];
    return model;
  };

  it("현관이 없으면 가장 넓은 방 안에서 시작한다(벽 속에서 시작하지 않는다)", () => {
    const scene = buildScene(unlabeled());
    // 가장 넓은 방(big)의 무게중심 = (2000, 3000)mm → 씬 좌표 (0, 0)
    expect(scene.spawn.x).toBeCloseTo(0);
    expect(scene.spawn.z).toBeCloseTo(0);
  });

  it("라벨이 없어도 벽·바닥·충돌을 모두 만든다", () => {
    const scene = buildScene(unlabeled());
    expect(scene.walls.length).toBeGreaterThan(0);
    expect(scene.floors).toHaveLength(2);
    expect(scene.collision.length).toBeGreaterThan(0);
  });

  it("라벨이 없어도 바닥 색이 정해진다", () => {
    expect(buildScene(unlabeled()).floors.every((f) => Boolean(f.color))).toBe(true);
  });
});
