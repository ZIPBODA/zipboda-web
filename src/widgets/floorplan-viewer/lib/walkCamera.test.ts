import { describe, expect, it } from "vitest";
import { MathUtils } from "three";
import { walkVerticalFov } from "./walkCamera";

describe("walkVerticalFov", () => {
  it("PC에서 방의 폭을 확보하고 초광폭에서는 수평 시야를 제한한다", () => {
    expect(walkVerticalFov(1280 / 900)).toBe(75);
    const aspect = 32 / 9;
    const horizontal = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(walkVerticalFov(aspect)) / 2) * aspect));
    expect(horizontal).toBeCloseTo(105);
  });

  it("세로 화면에서는 수평 시야를 확보하되 수직 광각을 제한한다", () => {
    expect(walkVerticalFov(360 / 900)).toBe(85);
    expect(walkVerticalFov(767 / 900)).toBeCloseTo(walkVerticalFov(768 / 900), 0);
    expect(walkVerticalFov(0.999)).toBeCloseTo(walkVerticalFov(1.001), 0);
  });

  it.each([0, -1, Infinity, NaN])("크기를 측정할 수 없는 경우에도 유효한 투영을 유지한다: %s", (aspect) => {
    expect(walkVerticalFov(aspect)).toBe(75);
  });
});
