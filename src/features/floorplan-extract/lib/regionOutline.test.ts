import { describe, it, expect } from "vitest";
import { traceRegionOutline, dropCollinear } from "./regionOutline";
import type { PointPx } from "../model/types";

const areaOf = (poly: PointPx[]) => {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
};

describe("traceRegionOutline", () => {
  it("사각형 영역은 꼭짓점 4개", () => {
    const inRegion = (x: number, y: number) => 2 <= x && x <= 5 && 3 <= y && y <= 7;
    const poly = traceRegionOutline(inRegion, 2, 3, 5, 7);
    expect(poly).toHaveLength(4);
    expect(areaOf(poly)).toBe(4 * 5);
  });

  it("ㄱ자 영역의 면적이 bbox가 아니라 실제와 같다", () => {
    // 10x10 정사각형에서 오른쪽 아래 6x6을 덜어낸 ㄱ자 — 실제 100-36=64, bbox는 100
    const inRegion = (x: number, y: number) => {
      const inside = 0 <= x && x < 10 && 0 <= y && y < 10;
      const cut = x >= 4 && y >= 4;
      return inside && !cut;
    };
    const poly = traceRegionOutline(inRegion, 0, 0, 9, 9);
    expect(areaOf(poly)).toBe(64);
    expect(areaOf(poly)).toBeLessThan(100);
    expect(poly).toHaveLength(6);
  });

  it("얇은 통로는 bbox보다 훨씬 작은 면적으로 나온다", () => {
    // 폭 2, 길이 40 통로 — bbox 80, 실제 80... 대신 ㄴ자 통로로 확인
    const inRegion = (x: number, y: number) => {
      const horizontal = 0 <= x && x < 40 && 0 <= y && y < 2;
      const vertical = 0 <= x && x < 2 && 0 <= y && y < 30;
      return horizontal || vertical;
    };
    const poly = traceRegionOutline(inRegion, 0, 0, 39, 29);
    expect(areaOf(poly)).toBe(40 * 2 + 2 * 28);
    expect(areaOf(poly)).toBeLessThan(40 * 30);
  });

  it("빈 영역은 빈 배열", () => {
    expect(traceRegionOutline(() => false, 0, 0, 5, 5)).toEqual([]);
  });

  it("한 픽셀도 사각형으로 나온다", () => {
    const poly = traceRegionOutline((x, y) => x === 3 && y === 4, 3, 4, 3, 4);
    expect(areaOf(poly)).toBe(1);
  });
});

describe("dropCollinear", () => {
  it("직선 위 중간 점을 없앤다", () => {
    const poly = dropCollinear([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ]);
    expect(poly).toHaveLength(4);
  });

  it("점이 3개 미만이면 그대로 둔다", () => {
    const poly = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    expect(dropCollinear(poly)).toEqual(poly);
  });
});
