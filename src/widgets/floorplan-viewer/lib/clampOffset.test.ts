import { describe, it, expect } from "vitest";
import { clampOffset } from "./clampOffset";

const size = { width: 800, height: 600 };

describe("clampOffset", () => {
  it("맞춤 배율에서는 이동할 여지가 없다", () => {
    expect(clampOffset({ x: 300, y: -200 }, size, 1)).toEqual({ x: 0, y: 0 });
  });

  it("확대한 만큼 양옆으로 이동할 수 있다", () => {
    // 2배에서 남는 폭은 800, 좌우 절반씩이라 한계는 400
    expect(clampOffset({ x: 1000, y: 0 }, size, 2)).toEqual({ x: 400, y: 0 });
    expect(clampOffset({ x: -1000, y: 0 }, size, 2)).toEqual({ x: -400, y: 0 });
  });

  it("한계 안의 이동은 그대로 둔다", () => {
    expect(clampOffset({ x: 120, y: -80 }, size, 2)).toEqual({ x: 120, y: -80 });
  });

  it("세로 한계는 높이로 계산한다", () => {
    expect(clampOffset({ x: 0, y: 999 }, size, 2)).toEqual({ x: 0, y: 300 });
  });
});
