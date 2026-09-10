import { describe, it, expect } from "vitest";
import { estimateScale, areaDeviation } from "./scaleFromChains";

describe("estimateScale", () => {
  it("분할 치수 합이 전체 치수와 일치하면 체인으로 고신뢰 추정한다", () => {
    const result = estimateScale([4500, 1100, 1670, 1730], 450);
    expect(result).not.toBeNull();
    expect(result?.totalMm).toBe(4500);
    expect(result?.mmPerPx).toBeCloseTo(10);
    expect(result?.chainMm.sort((a, b) => a - b)).toEqual([1100, 1670, 1730]);
    expect(result?.confidence).toBe(0.95);
  });

  it("전체 치수만 있으면 최대값으로 저신뢰 추정한다", () => {
    const result = estimateScale([4500], 450);
    expect(result?.totalMm).toBe(4500);
    expect(result?.mmPerPx).toBeCloseTo(10);
    expect(result?.confidence).toBe(0.6);
  });

  it("OCR 노이즈(0·음수·NaN)는 무시한다", () => {
    const result = estimateScale([0, -5, NaN, 4500, 1000, 3500], 900);
    expect(result?.totalMm).toBe(4500);
    expect(result?.mmPerPx).toBeCloseTo(5);
  });

  it("후보가 없거나 픽셀 길이가 0이면 null", () => {
    expect(estimateScale([], 100)).toBeNull();
    expect(estimateScale([4500], 0)).toBeNull();
  });
});

describe("areaDeviation", () => {
  it("스케일이 맞으면 편차 0에 가깝다", () => {
    // 450×1004px, 10mm/px → 4.5m × 10.04m = 45.18㎡
    expect(areaDeviation(10, 450 * 1004, 45.18)).toBeCloseTo(0, 3);
  });

  it("스케일이 2배 틀리면 면적 편차는 4배 수준으로 커진다", () => {
    expect(areaDeviation(20, 450 * 1004, 45.18)).toBeCloseTo(3, 1);
  });
});
