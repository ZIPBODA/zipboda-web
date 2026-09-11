import { describe, it, expect } from "vitest";
import { assembleModel } from "./assembleModel";
import type { AssembleInput } from "./assembleModel";

// 450×600px 크롭, 10mm/px → 4.5m × 6m. 좌·우 두 방, 외곽 4벽 + 중앙 세로 벽
const input = (): AssembleInput => ({
  crop: { x: 100, y: 50, width: 450, height: 600 },
  mmPerPx: 10,
  scaleSource: "dimension-chain",
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
    { id: "region-0", bbox: { minX: 3, minY: 3, maxX: 198, maxY: 596 }, polygon: [], areaPx: 1, touchesBorder: false },
    { id: "region-1", bbox: { minX: 202, minY: 3, maxX: 446, maxY: 596 }, polygon: [], areaPx: 1, touchesBorder: false }
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

  it("체인이 단일 값이면 체인을 기록하지 않는다", () => {
    const model = assembleModel({ ...input(), chainMm: [4500] });
    expect(model.printed.dimensionChains).toEqual([]);
  });

  it("스케일 출처는 호출부가 정한 값을 그대로 싣는다", () => {
    expect(assembleModel({ ...input(), scaleSource: "area", chainMm: [] }).scale.source).toBe("area");
    expect(assembleModel({ ...input(), scaleSource: "estimated", chainMm: [] }).scale.source).toBe("estimated");
  });

  it("라벨이 없는 영역은 기타·신뢰도 0으로 채운다", () => {
    const model = assembleModel({ ...input(), labels: {} });
    expect(model.rooms.every((r) => r.label === "기타")).toBe(true);
    expect(model.confidence.perRoom).toEqual({ "room-0": 0, "room-1": 0 });
  });
});

describe("assembleModel 개구부", () => {
  // 중앙 세로 벽(x=200)을 y 300~390px(=900mm) 구간만 비워 문을 만든다
  const withInteriorDoor = (): AssembleInput => {
    const base = input();
    base.segments = base.segments.filter((s) => !(s.a.x === 200 && s.b.x === 200));
    base.segments.push(
      { a: { x: 200, y: 3 }, b: { x: 200, y: 299 }, thicknessPx: 2 },
      { a: { x: 200, y: 390 }, b: { x: 200, y: 596 }, thicknessPx: 2 }
    );
    return base;
  };

  it("내벽의 빈 구간을 문으로 검출하고 벽은 하나로 잇는다", () => {
    const model = assembleModel(withInteriorDoor());
    const doors = model.openings.filter((o) => o.type === "door");
    expect(doors).toHaveLength(1);
    expect(doors[0].widthMm).toBe(900);

    const wall = model.walls.find((w) => w.id === doors[0].wallId);
    expect(wall).toBeDefined();
    expect(wall?.exterior).toBe(false);
    expect(wall?.a).toEqual({ x: 2000, z: 30 });
    expect(wall?.b).toEqual({ x: 2000, z: 5960 });
  });

  it("개구부는 소속 벽 길이 안에 들어간다", () => {
    const model = assembleModel(withInteriorDoor());
    for (const opening of model.openings) {
      const wall = model.walls.find((w) => w.id === opening.wallId);
      expect(wall).toBeDefined();
      if (!wall) continue;
      const length = Math.hypot(wall.b.x - wall.a.x, wall.b.z - wall.a.z);
      expect(opening.offsetMm).toBeGreaterThanOrEqual(0);
      expect(opening.offsetMm + opening.widthMm).toBeLessThanOrEqual(length);
    }
  });

  it("외벽의 넓은 빈 구간은 창으로 본다", () => {
    const base = input();
    // 하단 외벽(y=598)을 x 150~330px(=1800mm) 비움
    base.segments = base.segments.filter((s) => !(s.a.y === 598 && s.b.y === 598));
    base.segments.push(
      { a: { x: 0, y: 598 }, b: { x: 149, y: 598 }, thicknessPx: 3 },
      { a: { x: 330, y: 598 }, b: { x: 449, y: 598 }, thicknessPx: 3 }
    );
    const model = assembleModel(base);
    const windows = model.openings.filter((o) => o.type === "window");
    expect(windows).toHaveLength(1);
    expect(windows[0].widthMm).toBe(1800);
  });

  it("현관에 접한 좁은 외벽 개구부는 현관문으로 본다", () => {
    const base = input();
    base.labels = { ...base.labels, "region-0": { label: "현관", confidence: 1 } };
    // 좌측 외벽(x=1)을 y 100~190px(=900mm) 비움 — 현관(region-0) 옆
    base.segments = base.segments.filter((s) => !(s.a.x === 1 && s.b.x === 1));
    base.segments.push(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 99 }, thicknessPx: 3 },
      { a: { x: 1, y: 190 }, b: { x: 1, y: 599 }, thicknessPx: 3 }
    );
    const model = assembleModel(base);
    const entrance = model.openings.find((o) => o.wallId === model.walls.find((w) => w.a.x === 10 && w.exterior)?.id);
    expect(entrance?.type).toBe("door");
  });

  it("개구부가 없으면 빈 배열", () => {
    expect(assembleModel(input()).openings).toEqual([]);
  });
});

describe("assembleModel 방 폴리곤", () => {
  it("영역 윤곽이 있으면 bbox 대신 윤곽을 실척으로 옮긴다", () => {
    const base = input();
    // ㄱ자 윤곽(픽셀 모서리) — bbox라면 200x200px이지만 실제는 한 귀퉁이가 비었다
    base.regions = [
      {
        id: "region-0",
        bbox: { minX: 0, minY: 0, maxX: 199, maxY: 199 },
        polygon: [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 100 },
          { x: 100, y: 100 },
          { x: 100, y: 200 },
          { x: 0, y: 200 }
        ],
        areaPx: 30000,
        touchesBorder: false
      }
    ];
    base.labels = { "region-0": { label: "거실", confidence: 1 } };
    const model = assembleModel(base);
    expect(model.rooms[0].polygon).toHaveLength(6);
    expect(model.rooms[0].polygon[2]).toEqual({ x: 2000, z: 1000 });
  });

  it("윤곽이 없으면 bbox 사각형으로 되돌린다", () => {
    const model = assembleModel(input());
    expect(model.rooms[0].polygon).toHaveLength(4);
  });
});
