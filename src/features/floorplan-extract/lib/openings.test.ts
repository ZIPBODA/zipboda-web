import { describe, it, expect } from "vitest";
import { detectWallOpenings, paintWallCenterlines, sealMaskBorder, sealWallGaps, wallTouchesEdge } from "./openings";
import type { WallSegmentPx } from "../model/types";

const h = (x1: number, x2: number, y: number, t = 10): WallSegmentPx => ({ a: { x: x1, y }, b: { x: x2, y }, thicknessPx: t });
const v = (y1: number, y2: number, x: number, t = 10): WallSegmentPx => ({ a: { x, y: y1 }, b: { x, y: y2 }, thicknessPx: t });

// 개구부 폭 범위: 20~100px
const MIN = 20;
const MAX = 100;

describe("detectWallOpenings", () => {
  it("문 간격으로 끊긴 두 세그먼트를 하나의 벽 + 개구부로 잇는다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(140, 299, 50)], MIN, MAX);
    expect(walls).toHaveLength(1);
    expect(walls[0].a).toEqual({ x: 0, y: 50 });
    expect(walls[0].b).toEqual({ x: 299, y: 50 });
    expect(walls[0].openings).toEqual([{ startPx: 100, endPx: 140 }]);
  });

  it("한 벽에 개구부가 여러 개면 모두 기록한다", () => {
    const walls = detectWallOpenings([h(0, 49, 10), h(90, 149, 10), h(190, 249, 10)], MIN, MAX);
    expect(walls).toHaveLength(1);
    expect(walls[0].openings).toEqual([
      { startPx: 50, endPx: 90 },
      { startPx: 150, endPx: 190 }
    ]);
  });

  it("최대 폭을 넘는 빈 구간은 개구부가 아니라 별개의 벽으로 둔다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(400, 499, 50)], MIN, MAX);
    expect(walls).toHaveLength(2);
    expect(walls.every((w) => w.openings.length === 0)).toBe(true);
  });

  it("최소 폭 미만의 빈 구간은 개구부가 아니라 벽 끊김이라 한 벽으로 잇는다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(110, 299, 50)], MIN, MAX);
    expect(walls).toHaveLength(1);
    expect(walls[0].openings).toEqual([]);
  });

  it("맞닿거나 겹치는 세그먼트는 개구부 없이 하나로 잇는다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(100, 199, 50)], MIN, MAX);
    expect(walls).toHaveLength(1);
    expect(walls[0].b.x).toBe(199);
    expect(walls[0].openings).toEqual([]);
  });

  it("세로 벽도 같은 규칙으로 처리한다", () => {
    const walls = detectWallOpenings([v(0, 99, 30), v(140, 299, 30)], MIN, MAX);
    expect(walls).toHaveLength(1);
    expect(walls[0].a).toEqual({ x: 30, y: 0 });
    expect(walls[0].b).toEqual({ x: 30, y: 299 });
    expect(walls[0].openings).toEqual([{ startPx: 100, endPx: 140 }]);
  });

  it("중심선이 허용 오차 안이면 같은 벽 축선으로 묶는다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(140, 299, 52)], MIN, MAX, 4);
    expect(walls).toHaveLength(1);
    expect(walls[0].openings).toHaveLength(1);
  });

  it("축선이 다르면 별개의 벽으로 둔다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(140, 299, 200)], MIN, MAX, 4);
    expect(walls).toHaveLength(2);
  });

  it("가로·세로가 섞여도 방향별로 분리해 처리한다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(140, 299, 50), v(0, 299, 10)], MIN, MAX);
    expect(walls).toHaveLength(2);
    expect(walls.filter((w) => w.openings.length === 1)).toHaveLength(1);
  });

  it("세그먼트가 없으면 빈 배열", () => {
    expect(detectWallOpenings([], MIN, MAX)).toEqual([]);
  });
});

describe("sealWallGaps", () => {
  const blank = (w: number, h: number) => ({ data: new Uint8Array(w * h), width: w, height: h });
  const on = (m: { data: Uint8Array; width: number }, x: number, y: number) => m.data[y * m.width + x] === 1;

  it("벽의 빈 구간을 메워 플러드필이 새지 않게 한다", () => {
    const mask = blank(200, 60);
    // y=30 라인에 x 0~79, 120~199 벽(두께 1). 80~119가 틈
    for (let x = 0; x < 80; x++) mask.data[30 * 200 + x] = 1;
    for (let x = 120; x < 200; x++) mask.data[30 * 200 + x] = 1;
    const segments = [h(0, 79, 30, 1), h(120, 199, 30, 1)];

    expect(on(mask, 100, 30)).toBe(false);
    const sealed = sealWallGaps(mask, segments, 100);
    expect(on(sealed, 100, 30)).toBe(true);
    // 원본은 그대로여야 개구부 검출이 가능하다
    expect(on(mask, 100, 30)).toBe(false);
  });

  it("최대 폭을 넘는 빈 구간은 메우지 않는다", () => {
    const mask = blank(400, 60);
    for (let x = 0; x < 80; x++) mask.data[30 * 400 + x] = 1;
    for (let x = 300; x < 400; x++) mask.data[30 * 400 + x] = 1;
    const sealed = sealWallGaps(mask, [h(0, 79, 30, 1), h(300, 399, 30, 1)], 100);
    expect(on(sealed, 200, 30)).toBe(false);
  });
});

describe("sealWallGaps 외벽", () => {
  const blank = (w: number, h: number) => ({ data: new Uint8Array(w * h), width: w, height: h });
  const on = (m: { data: Uint8Array; width: number }, x: number, y: number) => m.data[y * m.width + x] === 1;

  it("외벽은 큰 개구부라도 닫아 바깥으로 새지 않게 한다", () => {
    const mask = blank(400, 200);
    // y=0 (외벽 라인)에 x 0~79, 300~399 — 220px 틈(maxGap 50보다 훨씬 큼)
    for (let x = 0; x < 80; x++) mask.data[0 * 400 + x] = 1;
    for (let x = 300; x < 400; x++) mask.data[0 * 400 + x] = 1;
    const sealed = sealWallGaps(mask, [h(0, 79, 0, 1), h(300, 399, 0, 1)], 50);
    expect(on(sealed, 200, 0)).toBe(true);
  });

  it("내벽의 큰 틈(오픈 플랜)은 그대로 열어 둔다", () => {
    const mask = blank(400, 200);
    for (let x = 0; x < 80; x++) mask.data[100 * 400 + x] = 1;
    for (let x = 300; x < 400; x++) mask.data[100 * 400 + x] = 1;
    const sealed = sealWallGaps(mask, [h(0, 79, 100, 1), h(300, 399, 100, 1)], 50);
    expect(on(sealed, 200, 100)).toBe(false);
  });
});

describe("wallTouchesEdge", () => {
  it("두꺼운 벽이 경계에 붙어 있으면 중심선이 허용치를 넘어도 외벽으로 본다", () => {
    // 두께 15px 벽이 경계에 밀착 → 중심선 7, 가까운 면 -0.5
    expect(wallTouchesEdge(7, 15, 700, 2)).toBe(true);
  });

  it("반대쪽 경계도 같게 판단한다", () => {
    expect(wallTouchesEdge(692, 15, 700, 2)).toBe(true);
  });

  it("안쪽 칸막이는 외벽이 아니다", () => {
    expect(wallTouchesEdge(300, 7, 700, 2)).toBe(false);
  });

  it("얇은 벽은 중심선 기준과 동일하게 동작한다", () => {
    expect(wallTouchesEdge(1, 1, 700, 2)).toBe(true);
    expect(wallTouchesEdge(50, 1, 700, 2)).toBe(false);
  });
});

describe("sealWallGaps 두께 있는 외벽", () => {
  const blank = (w: number, h: number) => ({ data: new Uint8Array(w * h), width: w, height: h });
  const on = (m: { data: Uint8Array; width: number }, x: number, y: number) => m.data[y * m.width + x] === 1;

  it("경계에 밀착한 두꺼운 외벽의 큰 개구부도 닫는다", () => {
    const mask = blank(400, 200);
    // 중심선 y=7, 두께 15 — 경계 밀착 외벽. 220px 틈
    for (let x = 0; x < 80; x++) for (let k = 0; k < 15; k++) mask.data[k * 400 + x] = 1;
    for (let x = 300; x < 400; x++) for (let k = 0; k < 15; k++) mask.data[k * 400 + x] = 1;
    const sealed = sealWallGaps(mask, [h(0, 79, 7, 15), h(300, 399, 7, 15)], 50);
    expect(on(sealed, 200, 7)).toBe(true);
  });
});

describe("sealWallGaps 어긋난 조각", () => {
  it("중심선이 몇 px 어긋난 두 조각 사이도 축선을 그어 막는다", () => {
    const mask = { data: new Uint8Array(200 * 100), width: 200, height: 100 };
    // 왼쪽 조각 y=50(두께 20), 오른쪽 조각 y=44(두께 8) — 몸통이 겹치지 않아 x=100 근처가 뚫린다
    const sealed = sealWallGaps(mask, [h(0, 99, 50, 20), h(100, 199, 44, 8)], 150, 0);
    const at = (x: number, y: number) => sealed.data[y * 200 + x] === 1;
    // 이어 붙인 벽의 중앙선(두 조각 중앙값) 위로 끝에서 끝까지 이어진다
    const line = [44, 50].find((y) => at(0, y) && at(199, y));
    expect(line).toBeDefined();
    for (let x = 0; x < 200; x++) expect(at(x, line as number)).toBe(true);
  });
});

describe("sealMaskBorder", () => {
  it("테두리를 벽으로 막아 플러드필이 빠져나가지 못하게 한다", () => {
    const mask = { data: new Uint8Array(10 * 8), width: 10, height: 8 };
    const sealed = sealMaskBorder(mask);
    const at = (x: number, y: number) => sealed.data[y * 10 + x] === 1;
    expect(at(0, 0)).toBe(true);
    expect(at(9, 7)).toBe(true);
    expect(at(5, 0)).toBe(true);
    expect(at(0, 4)).toBe(true);
    expect(at(5, 4)).toBe(false);
  });

  it("띠 두께를 주면 그만큼 안쪽까지 막는다", () => {
    const mask = { data: new Uint8Array(10 * 8), width: 10, height: 8 };
    const sealed = sealMaskBorder(mask, 3);
    const at = (x: number, y: number) => sealed.data[y * 10 + x] === 1;
    expect(at(2, 4)).toBe(true);
    expect(at(3, 4)).toBe(false);
    expect(at(5, 5)).toBe(true);
    expect(at(5, 4)).toBe(false);
  });

  it("원본은 바꾸지 않는다", () => {
    const mask = { data: new Uint8Array(6 * 6), width: 6, height: 6 };
    sealMaskBorder(mask);
    expect(mask.data.every((v) => v === 0)).toBe(true);
  });
});

describe("paintWallCenterlines", () => {
  it("중심선을 1px로 그리고 양 끝을 늘려 맞닿은 벽에 닿게 한다", () => {
    const mask = { data: new Uint8Array(20 * 10), width: 20, height: 10 };
    const painted = paintWallCenterlines(mask, [h(5, 10, 4)], 2);
    const at = (x: number, y: number) => painted.data[y * 20 + x] === 1;
    expect(at(3, 4)).toBe(true);
    expect(at(12, 4)).toBe(true);
    expect(at(2, 4)).toBe(false);
    expect(at(13, 4)).toBe(false);
    expect(at(7, 3)).toBe(false);
    expect(at(7, 5)).toBe(false);
  });

  it("원본은 바꾸지 않는다", () => {
    const mask = { data: new Uint8Array(20 * 10), width: 20, height: 10 };
    paintWallCenterlines(mask, [v(0, 9, 5)], 1);
    expect(mask.data.every((value) => value === 0)).toBe(true);
  });
});
