import { describe, it, expect } from "vitest";
import { detectWallOpenings } from "./openings";
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

  it("최소 폭 미만의 빈 구간은 노이즈로 보고 개구부로 잡지 않는다", () => {
    const walls = detectWallOpenings([h(0, 99, 50), h(105, 199, 50)], MIN, MAX);
    expect(walls).toHaveLength(2);
    expect(walls.every((w) => w.openings.length === 0)).toBe(true);
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
