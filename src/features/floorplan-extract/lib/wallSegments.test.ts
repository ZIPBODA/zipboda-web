import { describe, it, expect } from "vitest";
import { extractWallSegments, filterInkSegments, inkRatio } from "./wallSegments";
import type { MaskImage } from "../model/types";

function makeMask(width: number, height: number, paint: (x: number, y: number) => boolean): MaskImage {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (paint(x, y)) data[y * width + x] = 1;
  return { data, width, height };
}

describe("extractWallSegments", () => {
  it("가로 굵은 벽 하나를 두께와 함께 추출하고 단면 런은 버린다", () => {
    // 60×40, y=10..12(3px 두께) x=5..54 가로 벽
    const mask = makeMask(60, 40, (x, y) => 10 <= y && y <= 12 && 5 <= x && x <= 54);
    const segments = extractWallSegments(mask, 20);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ a: { x: 5, y: 11 }, b: { x: 54, y: 11 }, thicknessPx: 3 });
  });

  it("가로·세로 벽을 각각 추출한다", () => {
    const mask = makeMask(60, 60, (x, y) => (10 <= y && y <= 12 && 5 <= x && x <= 54) || (30 <= x && x <= 32 && 5 <= y && y <= 54));
    const segments = extractWallSegments(mask, 20);
    const horizontal = segments.find((s) => s.a.y === s.b.y);
    const vertical = segments.find((s) => s.a.x === s.b.x);
    expect(horizontal).toMatchObject({ a: { x: 5, y: 11 }, b: { x: 54, y: 11 } });
    expect(vertical).toMatchObject({ a: { x: 31, y: 5 }, b: { x: 31, y: 54 } });
  });

  it("최소 길이 미만의 짧은 런(글자·노이즈)은 무시한다", () => {
    const mask = makeMask(60, 40, (x, y) => y === 20 && 10 <= x && x <= 15);
    expect(extractWallSegments(mask, 20)).toHaveLength(0);
  });

  it("빈 마스크는 세그먼트 없음", () => {
    expect(extractWallSegments(makeMask(20, 20, () => false))).toHaveLength(0);
  });
});

describe("extractWallSegments 두께 프로파일", () => {
  it("벽에 붙어 그려진 상자는 벽 두께로 뭉치지 않고 따로 갈린다", () => {
    // 세로 벽 x=50..59(10px) y=0..119, 그 왼쪽에 붙은 상자 x=20..49 y=0..39
    const mask = makeMask(120, 120, (x, y) => (50 <= x && x <= 59) || (20 <= x && x <= 49 && y <= 39));
    const vertical = extractWallSegments(mask, 20).filter((s) => s.a.x === s.b.x);
    const wall = vertical.find((s) => s.thicknessPx === 10);
    expect(wall).toBeDefined();
    // 상자가 없는 구간(y 40~119)은 벽 두께 10px로 남는다
    expect(wall?.a.y).toBe(40);
    expect(wall?.b.y).toBe(119);
    expect(vertical.some((s) => s.thicknessPx >= 40 && s.b.y - s.a.y + 1 > 80)).toBe(false);
  });

  it("두께가 일정한 벽은 하나의 세그먼트로 남는다", () => {
    const mask = makeMask(100, 40, (x, y) => 10 <= y && y <= 19 && 5 <= x && x <= 94);
    const segments = extractWallSegments(mask, 20);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ a: { x: 5, y: 15 }, b: { x: 94, y: 15 }, thicknessPx: 10 });
  });
});

describe("filterInkSegments", () => {
  const segment = { a: { x: 5, y: 10 }, b: { x: 54, y: 10 }, thicknessPx: 5 };

  it("몸통이 검정 잉크로 채워진 세그먼트는 남긴다", () => {
    const ink = makeMask(60, 20, (x, y) => 8 <= y && y <= 12 && 5 <= x && x <= 54);
    expect(inkRatio(segment, ink)).toBeCloseTo(1);
    expect(filterInkSegments([segment], ink, 0.5)).toHaveLength(1);
  });

  it("갈색·회색으로 채워져 잉크가 거의 없는 세그먼트(가구)는 버린다", () => {
    const ink = makeMask(60, 20, (x, y) => y === 8 && 5 <= x && x <= 54);
    expect(inkRatio(segment, ink)).toBeCloseTo(0.2);
    expect(filterInkSegments([segment], ink, 0.5)).toHaveLength(0);
  });
});

describe("extractWallSegments 잉크 프로파일", () => {
  it("벽에 붙은 어두운 가구는 두께·중심선에서 빼고 벽만 잰다", () => {
    // 세로 벽 x=10..19(잉크) + 오른쪽에 붙은 어두운 가구 x=20..39(잉크 아님), y=0..99
    const dark = makeMask(60, 100, (x, y) => 10 <= x && x <= 39 && y < 100);
    const ink = makeMask(60, 100, (x, y) => 10 <= x && x <= 19 && y < 100);
    const [wall] = extractWallSegments(dark, 20, ink).filter((s) => s.a.x === s.b.x);
    expect(wall.thicknessPx).toBe(10);
    expect(wall.a.x).toBe(15);
  });

  it("잉크가 전혀 없는 덩어리(가구만)는 세그먼트가 되지 않는다", () => {
    const dark = makeMask(60, 100, (x) => 20 <= x && x <= 39);
    const ink = makeMask(60, 100, () => false);
    expect(extractWallSegments(dark, 20, ink)).toHaveLength(0);
  });
});
