import { describe, it, expect } from "vitest";
import { estimateScale, areaDeviation, scaleFromArea } from "./scaleFromChains";

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

describe("estimateScale 치수 타당성", () => {
  it("제목에서 이어붙은 숫자(51형 51.93 180호 → 515193180)를 치수로 쓰지 않는다", () => {
    expect(estimateScale([515193180], 203)).toBeNull();
  });

  it("타당 범위 밖 값은 버리고 남은 값으로 추정한다", () => {
    const scale = estimateScale([515193180, 3600, 3300], 200);
    expect(scale).not.toBeNull();
    expect(scale?.totalMm).toBe(6900);
  });

  it("전체 치수가 없으면 분할 치수의 합을 전체로 본다", () => {
    const scale = estimateScale([3600, 3300], 200);
    expect(scale?.totalMm).toBe(6900);
    expect(scale?.chainMm).toEqual([3600, 3300]);
    expect(scale?.mmPerPx).toBeCloseTo(34.5);
  });

  it("전체 치수가 있으면 합보다 전체를 우선한다", () => {
    const scale = estimateScale([4500, 1100, 1670, 1730], 330);
    expect(scale?.totalMm).toBe(4500);
    expect(scale?.chainMm.sort((a, b) => a - b)).toEqual([1100, 1670, 1730]);
  });

  it("너무 작은 숫자(벽 두께·호수 등)는 치수로 보지 않는다", () => {
    expect(estimateScale([110, 300], 200)).toBeNull();
  });

  it("합이 타당 범위를 넘으면 분할로 보지 않는다", () => {
    const scale = estimateScale([19000, 19000], 200);
    expect(scale?.totalMm).toBe(19000);
  });
});

describe("scaleFromArea", () => {
  it("인쇄 전용면적으로 스케일을 역산한다", () => {
    // 51.93㎡가 38773px에 담기면 한 변은 약 36.6mm/px
    const scale = scaleFromArea(51.93, 38773);
    expect(scale?.mmPerPx).toBeCloseTo(36.6, 0);
  });

  it("면적이 없으면 쓰지 않는다", () => {
    expect(scaleFromArea(undefined, 10000)).toBeNull();
    expect(scaleFromArea(0, 10000)).toBeNull();
  });

  it("픽셀 면적이 없으면 쓰지 않는다", () => {
    expect(scaleFromArea(33.56, 0)).toBeNull();
  });

  it("치수 체인보다 확신이 낮다", () => {
    const area = scaleFromArea(33.56, 200000);
    const chain = estimateScale([4500, 1100, 1670, 1730], 330);
    expect(area!.confidence).toBeLessThan(chain!.confidence);
  });
});
