import { describe, it, expect } from "vitest";
import { floorTextureRepeat, wallTextureRepeat } from "./textureRepeat";

describe("wallTextureRepeat", () => {
  it("벽 길이·높이를 타일 크기로 나눈 반복 수를 돌려준다", () => {
    expect(wallTextureRepeat(4, 2.4, 1)).toEqual({ x: 4, y: 2.4 });
    expect(wallTextureRepeat(0.9, 0.3, 0.5)).toEqual({ x: 1.8, y: 0.6 });
  });
});

describe("floorTextureRepeat", () => {
  it("미터 단위 UV에 맞춰 타일 크기의 역수를 양 축에 적용한다", () => {
    const r = floorTextureRepeat(1.2);
    expect(r.x).toBeCloseTo(1 / 1.2);
    expect(r.y).toBeCloseTo(1 / 1.2);
  });
});
