import { describe, it, expect } from "vitest";
import {
  snapPolygonOrthogonal,
  polygonAreaM2,
  validateScale,
  validateArea,
  validateTiling,
  mergeCollinearWalls,
  validateOpenings,
  checkReachability,
  rectilinearIntersectionArea,
  normalizeModel
} from "./normalize";
import type { FloorplanModel2D, PointMm } from "../model/types";

const rect = (x: number, z: number, w: number, d: number): PointMm[] => [
  { x, z },
  { x: x + w, z },
  { x: x + w, z: z + d },
  { x, z: z + d }
];

// 4500×6000 유닛: 좌 현관+거실(2000폭), 우 침실(2500폭), 중앙 벽(x=2000)에 문
const twoRoomModel = (): FloorplanModel2D => ({
  scale: { mmPerPx: 10, source: "dimension-chain" },
  outline: rect(0, 0, 4500, 6000),
  rooms: [
    { id: "r-entrance", label: "현관", polygon: rect(0, 0, 2000, 1500) },
    { id: "r-living", label: "거실", polygon: rect(0, 1500, 2000, 4500) },
    { id: "r-bed", label: "침실", polygon: rect(2000, 0, 2500, 6000) }
  ],
  walls: [
    { id: "w-top", a: { x: 0, z: 0 }, b: { x: 4500, z: 0 }, thicknessMm: 150, exterior: true },
    { id: "w-right", a: { x: 4500, z: 0 }, b: { x: 4500, z: 6000 }, thicknessMm: 150, exterior: true },
    { id: "w-bottom", a: { x: 0, z: 6000 }, b: { x: 4500, z: 6000 }, thicknessMm: 150, exterior: true },
    { id: "w-left", a: { x: 0, z: 0 }, b: { x: 0, z: 6000 }, thicknessMm: 150, exterior: true },
    { id: "w-mid", a: { x: 2000, z: 0 }, b: { x: 2000, z: 6000 }, thicknessMm: 100, exterior: false },
    { id: "w-hall", a: { x: 0, z: 1500 }, b: { x: 2000, z: 1500 }, thicknessMm: 100, exterior: false }
  ],
  openings: [
    { wallId: "w-mid", type: "door", offsetMm: 2700, widthMm: 900 },
    { wallId: "w-hall", type: "door", offsetMm: 550, widthMm: 900 }
  ],
  printed: { exclusiveAreaM2: 27, dimensionChains: [{ axis: "x", values: [2000, 2500] }, { axis: "z", values: [1500, 4500] }] },
  confidence: { overall: 0, perRoom: {} }
});

describe("snapPolygonOrthogonal", () => {
  it("비스듬한 꼭짓점을 그리드·직교로 스냅한다", () => {
    const poly = snapPolygonOrthogonal([
      { x: 12, z: 8 },
      { x: 2010, z: 30 },
      { x: 1990, z: 3020 },
      { x: 5, z: 2995 }
    ]);
    expect(poly).toEqual([
      { x: 0, z: 0 },
      { x: 2000, z: 0 },
      { x: 2000, z: 3000 },
      { x: 0, z: 3000 }
    ]);
  });
});

describe("polygonAreaM2", () => {
  it("직사각형 면적을 ㎡로 계산한다", () => {
    expect(polygonAreaM2(rect(0, 0, 4500, 6000))).toBeCloseTo(27);
  });
});

describe("validateScale", () => {
  it("치수 체인 합이 외곽과 일치하면 플래그 없음", () => {
    expect(validateScale(twoRoomModel())).toEqual([]);
  });

  it("체인 합이 외곽과 다르면 scale-mismatch", () => {
    const model = twoRoomModel();
    model.printed.dimensionChains = [{ axis: "x", values: [2000, 3000] }];
    expect(validateScale(model).map((f) => f.code)).toEqual(["scale-mismatch"]);
  });

  it("체인이 없으면 scale-no-chain", () => {
    const model = twoRoomModel();
    model.printed.dimensionChains = [];
    expect(validateScale(model).map((f) => f.code)).toEqual(["scale-no-chain"]);
  });
});

describe("validateArea", () => {
  it("방 면적 합이 전용면적과 맞으면 통과한다", () => {
    expect(validateArea(twoRoomModel())).toEqual([]);
  });

  it("발코니는 전용면적 합산에서 제외한다", () => {
    const model = twoRoomModel();
    model.rooms.push({ id: "r-balcony", label: "발코니", polygon: rect(0, 6000, 4500, 1300) });
    expect(validateArea(model)).toEqual([]);
  });

  it("5% 넘게 어긋나면 area-mismatch", () => {
    const model = twoRoomModel();
    model.printed.exclusiveAreaM2 = 33;
    expect(validateArea(model).map((f) => f.code)).toEqual(["area-mismatch"]);
  });
});

describe("validateTiling", () => {
  it("방이 외곽을 채우고 겹치지 않으면 통과한다", () => {
    expect(validateTiling(twoRoomModel())).toEqual([]);
  });

  it("방이 외곽을 덜 채우면 tiling-gap", () => {
    const model = twoRoomModel();
    model.rooms = model.rooms.slice(0, 1);
    expect(validateTiling(model).map((f) => f.code)).toContain("tiling-gap");
  });

  it("방이 겹치면 tiling-overlap", () => {
    const model = twoRoomModel();
    model.rooms[2].polygon = rect(1000, 0, 3500, 6000);
    expect(validateTiling(model).map((f) => f.code)).toContain("tiling-overlap");
  });
});

describe("mergeCollinearWalls", () => {
  it("같은 축선에서 맞닿은 벽을 하나로 합친다", () => {
    const merged = mergeCollinearWalls([
      { id: "a", a: { x: 0, z: 0 }, b: { x: 2000, z: 0 }, thicknessMm: 100, exterior: false },
      { id: "b", a: { x: 2000, z: 0 }, b: { x: 4500, z: 0 }, thicknessMm: 150, exterior: true }
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ a: { x: 0, z: 0 }, b: { x: 4500, z: 0 }, thicknessMm: 150, exterior: true });
  });

  it("떨어진 벽은 합치지 않는다", () => {
    const merged = mergeCollinearWalls([
      { id: "a", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 }, thicknessMm: 100, exterior: false },
      { id: "b", a: { x: 2000, z: 0 }, b: { x: 3000, z: 0 }, thicknessMm: 100, exterior: false }
    ]);
    expect(merged).toHaveLength(2);
  });
});

describe("validateOpenings", () => {
  it("벽 안에 있는 개구부는 통과한다", () => {
    expect(validateOpenings(twoRoomModel())).toEqual([]);
  });

  it("벽 길이를 넘는 개구부는 opening-invalid", () => {
    const model = twoRoomModel();
    model.openings[0] = { wallId: "w-mid", type: "door", offsetMm: 5800, widthMm: 900 };
    expect(validateOpenings(model).map((f) => f.code)).toEqual(["opening-invalid"]);
  });

  it("존재하지 않는 벽을 참조하면 opening-invalid", () => {
    const model = twoRoomModel();
    model.openings[0] = { wallId: "w-ghost", type: "door", offsetMm: 0, widthMm: 900 };
    expect(validateOpenings(model).map((f) => f.code)).toEqual(["opening-invalid"]);
  });
});

describe("rectilinearIntersectionArea", () => {
  it("겹치는 직사각형의 교차 면적을 계산한다", () => {
    expect(rectilinearIntersectionArea(rect(0, 0, 2000, 2000), rect(1000, 1000, 2000, 2000))).toBe(1_000_000);
  });

  it("L자 방과 그 오목한 곳에 놓인 방은 bbox가 겹쳐도 교차 면적 0", () => {
    const lShape: PointMm[] = [
      { x: 0, z: 0 },
      { x: 2000, z: 0 },
      { x: 2000, z: 1000 },
      { x: 4000, z: 1000 },
      { x: 4000, z: 3000 },
      { x: 0, z: 3000 }
    ];
    expect(rectilinearIntersectionArea(lShape, rect(2000, 0, 2000, 1000))).toBe(0);
    expect(rectilinearIntersectionArea(lShape, rect(2000, 500, 2000, 1000))).toBe(1_000_000);
  });

  it("맞닿기만 한 방은 교차 면적 0", () => {
    expect(rectilinearIntersectionArea(rect(0, 0, 2000, 2000), rect(2000, 0, 2000, 2000))).toBe(0);
  });
});

describe("checkReachability", () => {
  it("현관에서 문을 통해 모든 방에 도달하면 통과한다", () => {
    expect(checkReachability(twoRoomModel())).toEqual([]);
  });

  it("문이 하나도 없으면 no-doors", () => {
    const model = twoRoomModel();
    model.openings = [];
    expect(checkReachability(model).map((f) => f.code)).toEqual(["no-doors"]);
  });

  it("문이 빠진 방은 unreachable-room", () => {
    const model = twoRoomModel();
    model.openings = [model.openings[1]];
    const flags = checkReachability(model);
    expect(flags.map((f) => f.code)).toEqual(["unreachable-room"]);
    expect(flags[0].detail).toContain("침실");
  });

  it("벽 없이 맞닿은 개방 경계는 문 없이도 통행 가능으로 본다", () => {
    const model = twoRoomModel();
    // 현관↔거실 사이 벽·문 제거(오픈 플랜) — 침실 문만 남아도 전부 도달
    model.walls = model.walls.filter((w) => w.id !== "w-hall");
    model.openings = [model.openings[0]];
    expect(checkReachability(model)).toEqual([]);
  });

  it("개방 경계가 통행 폭 미만이면 인접으로 보지 않는다", () => {
    const model = twoRoomModel();
    // 침실 문은 현관 구간(z 0~1500)으로 옮겨 침실은 도달 가능하게 둔다
    model.openings = [{ ...model.openings[0], offsetMm: 300 }];
    // 현관↔거실 경계 2000 중 1600을 벽으로 막아 400만 남김
    model.walls = model.walls.map((w) => (w.id === "w-hall" ? { ...w, b: { x: 1600, z: 1500 } } : w));
    const flags = checkReachability(model);
    expect(flags.map((f) => f.code)).toEqual(["unreachable-room"]);
    expect(flags[0].detail).toContain("거실");
  });
});

describe("normalizeModel", () => {
  it("정합한 모델은 자동 확정된다", () => {
    const result = normalizeModel(twoRoomModel());
    expect(result.flags).toEqual([]);
    expect(result.confidence).toBe(1);
    expect(result.autoAccept).toBe(true);
    expect(result.model.confidence.overall).toBe(1);
  });

  it("결함이 누적되면 신뢰도가 떨어져 검수로 보낸다", () => {
    const model = twoRoomModel();
    model.openings = [];
    model.printed.exclusiveAreaM2 = 33;
    const result = normalizeModel(model);
    expect(result.autoAccept).toBe(false);
    expect(result.flags.map((f) => f.code)).toEqual(expect.arrayContaining(["no-doors", "area-mismatch"]));
  });
});

describe("checkReachability 예외", () => {
  const rect = (x: number, z: number, w: number, d: number) => [
    { x, z },
    { x: x + w, z },
    { x: x + w, z: z + d },
    { x, z: z + d }
  ];

  it("문이 없는 반침은 수납이라 도달 불가로 잡지 않는다", () => {
    const model = twoRoomModel();
    model.rooms.push({ id: "closet", label: "반침", polygon: rect(3000, 0, 1500, 450) });
    expect(checkReachability(model)).toEqual([]);
  });

  it("1.5㎡ 이하의 이름 없는 방은 PS·설비 공간으로 보고 묻지 않는다", () => {
    const model = twoRoomModel();
    model.rooms.push({ id: "ps", label: "기타", polygon: rect(3600, 0, 900, 1000) });
    expect(checkReachability(model)).toEqual([]);
  });

  it("1.5㎡를 넘는 이름 없는 방은 여전히 도달 불가로 잡는다", () => {
    const model = twoRoomModel();
    model.rooms.push({ id: "unknown", label: "기타", polygon: rect(2500, 0, 2000, 1500) });
    expect(checkReachability(model).map((f) => f.code)).toEqual(["unreachable-room"]);
  });
});

describe("checkReachability 출발점", () => {
  it("현관이 없으면 가장 넓은 방에서 도달성을 본다", () => {
    const model = twoRoomModel();
    // 현관 라벨을 지우고, 첫 번째 방을 구석 조각으로 만든다
    model.rooms = [
      { id: "r-scrap", label: "기타", polygon: rect(4000, 5500, 500, 500) },
      { id: "r-living", label: "거실", polygon: rect(0, 1500, 2000, 4500) },
      { id: "r-bed", label: "침실", polygon: rect(2000, 0, 2500, 6000) }
    ];
    const flags = checkReachability(model);
    // 넓은 방(침실·거실)은 문으로 이어져 있으므로 도달 불가로 잡히지 않는다
    expect(flags.some((f) => f.detail.includes("거실"))).toBe(false);
    expect(flags.some((f) => f.detail.includes("침실"))).toBe(false);
  });

  it("현관이 있으면 현관에서 출발한다", () => {
    expect(checkReachability(twoRoomModel())).toEqual([]);
  });
});

describe("validateArea 라벨이 없는 도면", () => {
  /** 방 이름이 인쇄되지 않았거나 OCR이 못 읽어 전부 '기타'인 모델 */
  const unlabeled = (): FloorplanModel2D => {
    const model = twoRoomModel();
    model.rooms = model.rooms.map((r) => ({ ...r, label: "기타" }));
    return model;
  };

  it("제외 대상을 못 읽으면 면적이 넘쳐도 걸지 않는다(발코니가 섞인 것일 수 있다)", () => {
    const model = unlabeled();
    // 발코니만큼 면적이 더 있는 상황
    model.rooms.push({ id: "r-extra", label: "기타", polygon: rect(0, 6000, 4500, 1300) });
    expect(validateArea(model)).toEqual([]);
  });

  it("제외 대상을 못 읽어도 면적이 모자라면 건다", () => {
    const model = unlabeled();
    model.rooms = model.rooms.slice(0, 1);
    const flags = validateArea(model);
    expect(flags.map((f) => f.code)).toEqual(["area-mismatch"]);
    expect(flags[0].detail).toContain("부족분만 검사");
  });

  it("발코니를 읽었으면 넘치는 쪽도 그대로 건다", () => {
    const model = twoRoomModel();
    model.rooms.push({ id: "r-balcony", label: "발코니", polygon: rect(0, 6000, 4500, 1300) });
    model.rooms.push({ id: "r-extra", label: "침실", polygon: rect(0, 7300, 4500, 2000) });
    expect(validateArea(model).map((f) => f.code)).toEqual(["area-mismatch"]);
  });

  it("라벨이 있든 없든 맞으면 통과한다", () => {
    expect(validateArea(twoRoomModel())).toEqual([]);
    expect(validateArea(unlabeled())).toEqual([]);
  });
});
