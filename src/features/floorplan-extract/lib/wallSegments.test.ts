import { describe, it, expect } from "vitest";
import { extractWallSegments } from "./wallSegments";
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
