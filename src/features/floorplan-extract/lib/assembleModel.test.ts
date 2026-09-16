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
    { a: { x: 0, y: 1 }, b: { x: 449, y: 1 }, thicknessPx: 15 },
    { a: { x: 448, y: 0 }, b: { x: 448, y: 599 }, thicknessPx: 15 },
    { a: { x: 0, y: 598 }, b: { x: 449, y: 598 }, thicknessPx: 15 },
    { a: { x: 1, y: 0 }, b: { x: 1, y: 599 }, thicknessPx: 15 },
    { a: { x: 200, y: 3 }, b: { x: 200, y: 596 }, thicknessPx: 12 }
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
    expect(interior[0]).toMatchObject({ a: { x: 2000, z: 30 }, b: { x: 2000, z: 5960 }, thicknessMm: 120 });
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
      { a: { x: 200, y: 3 }, b: { x: 200, y: 299 }, thicknessPx: 12 },
      { a: { x: 200, y: 390 }, b: { x: 200, y: 596 }, thicknessPx: 12 }
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
      { a: { x: 0, y: 598 }, b: { x: 149, y: 598 }, thicknessPx: 15 },
      { a: { x: 330, y: 598 }, b: { x: 449, y: 598 }, thicknessPx: 15 }
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
      { a: { x: 1, y: 0 }, b: { x: 1, y: 99 }, thicknessPx: 15 },
      { a: { x: 1, y: 190 }, b: { x: 1, y: 599 }, thicknessPx: 15 }
    );
    const model = assembleModel(base);
    const leftWall = model.walls.find((w) => w.exterior && w.a.x === w.b.x && w.a.x < 100);
    const entrance = model.openings.find((o) => o.wallId === leftWall?.id);
    expect(entrance?.type).toBe("door");
  });

  it("현관 방이 없어도 '현관' 글자 근처의 좁은 외벽 개구부는 현관문으로 본다", () => {
    const base = input();
    // 상단 외벽(y=1)을 x 150~239px(=900mm) 비움. 현관 방은 없고 글자만 그 아래 60px(600mm)에 있다
    base.segments = base.segments.filter((s) => !(s.a.y === 1 && s.b.y === 1));
    base.segments.push(
      { a: { x: 0, y: 1 }, b: { x: 149, y: 1 }, thicknessPx: 15 },
      { a: { x: 240, y: 1 }, b: { x: 449, y: 1 }, thicknessPx: 15 }
    );
    base.entranceHints = [{ x: 195, y: 60 }];
    const model = assembleModel(base);
    const topWall = model.walls.find((w) => w.exterior && w.a.z === w.b.z && w.a.z < 100);
    expect(model.openings.find((o) => o.wallId === topWall?.id)?.type).toBe("door");
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

describe("assembleModel 가구 윤곽 제외", () => {
  it("벽으로 보기에 너무 가는 선은 벽으로 만들지 않는다", () => {
    const base = input();
    // 10mm/px 기준 두께 3px = 30mm — 침대·가구 윤곽 수준
    base.segments = [...base.segments, { a: { x: 50, y: 300 }, b: { x: 250, y: 300 }, thicknessPx: 3 }];
    const model = assembleModel(base);
    expect(model.walls.every((w) => w.thicknessMm >= 100)).toBe(true);
  });

  it("가는 선 때문에 개구부가 생기지 않는다", () => {
    const base = input();
    base.segments = [
      { a: { x: 0, y: 100 }, b: { x: 99, y: 100 }, thicknessPx: 2 },
      { a: { x: 200, y: 100 }, b: { x: 300, y: 100 }, thicknessPx: 2 }
    ];
    expect(assembleModel(base).openings).toEqual([]);
  });

  it("두꺼운 실제 벽은 그대로 남긴다", () => {
    const model = assembleModel(input());
    expect(model.walls.length).toBeGreaterThan(0);
  });
});

describe("assembleModel 벽 두께 경계", () => {
  it("외벽은 두께를 300mm로 자르고 중심선을 외곽선에 붙인다", () => {
    const base = input();
    // 우측 외벽이 단열·마감까지 60px(=600mm) 덩어리로 읽힌 경우
    base.segments = base.segments.filter((s) => !(s.a.x === 448 && s.b.x === 448));
    base.segments.push({ a: { x: 400, y: 0 }, b: { x: 400, y: 599 }, thicknessPx: 60 });
    const model = assembleModel(base);
    const right = model.walls.find((w) => w.exterior && w.a.x === w.b.x && w.a.x > 4000);
    expect(right?.thicknessMm).toBe(300);
    // 크롭 폭 450px → 마지막 픽셀 449, 두께 30px의 절반 15 → 중심선 434px = 4340mm
    expect(right?.a.x).toBe(4340);
  });

  it("400mm를 넘는 실내 덩어리는 벽이 아니다", () => {
    const base = input();
    base.segments.push({ a: { x: 100, y: 300 }, b: { x: 300, y: 300 }, thicknessPx: 50 });
    const model = assembleModel(base);
    expect(model.walls.some((w) => w.thicknessMm === 500)).toBe(false);
  });
});

describe("assembleModel 벽 길이", () => {
  it("500mm보다 짧은 벽 토막은 버린다", () => {
    const base = input();
    base.segments.push({ a: { x: 100, y: 300 }, b: { x: 130, y: 300 }, thicknessPx: 12 });
    const model = assembleModel(base);
    expect(model.walls.some((w) => w.a.z === 3000 && w.b.z === 3000)).toBe(false);
  });

  it("작은 틈으로 끊긴 조각은 이어 붙인 뒤 길이를 본다", () => {
    const base = input();
    // 35px(350mm) 조각 두 개가 5px 틈을 두고 이어짐 → 한 벽 750mm
    base.segments.push({ a: { x: 100, y: 300 }, b: { x: 134, y: 300 }, thicknessPx: 12 }, { a: { x: 140, y: 300 }, b: { x: 174, y: 300 }, thicknessPx: 12 });
    const model = assembleModel(base);
    const joined = model.walls.find((w) => w.a.z === 3000 && w.b.z === 3000);
    expect(joined).toBeDefined();
    expect(Math.abs(joined!.b.x - joined!.a.x)).toBe(740);
  });
});

describe("assembleModel 설비 공간", () => {
  it("이름 없는 1.5㎡ 이하 영역은 방으로 세우지 않는다", () => {
    const base = input();
    base.regions.push({ id: "region-ps", bbox: { minX: 400, minY: 3, maxX: 446, maxY: 60 }, polygon: [], areaPx: 1, touchesBorder: false });
    const model = assembleModel(base);
    expect(model.rooms).toHaveLength(2);
  });
});
