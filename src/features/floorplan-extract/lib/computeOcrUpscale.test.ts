import { describe, it, expect } from "vitest";
import { computeOcrUpscale } from "./ocr";

describe("computeOcrUpscale", () => {
  it("고해상도 도면(1653px)은 기본 배율을 쓴다", () => {
    expect(computeOcrUpscale(1653)).toBe(3);
  });

  it("저해상도 도면(558px)은 더 크게 확대한다", () => {
    expect(computeOcrUpscale(558)).toBeGreaterThan(3);
  });

  it("배율에 상·하한을 둔다", () => {
    expect(computeOcrUpscale(100)).toBeLessThanOrEqual(8);
    expect(computeOcrUpscale(10000)).toBe(3);
  });

  it("잘못된 폭은 하한으로 처리한다", () => {
    expect(computeOcrUpscale(0)).toBe(3);
  });
});
