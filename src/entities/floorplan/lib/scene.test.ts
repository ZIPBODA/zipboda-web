import { describe, it, expect } from "vitest";
import { resolveCollision } from "./scene";
import { WALL_THICKNESS_M } from "../config/constants";

describe("resolveCollision", () => {
  it("벽에서 padding 밖에 있으면 위치를 유지한다", () => {
    const segs = [{ x1: -3, z1: 0, x2: 3, z2: 0 }];
    const p = resolveCollision(0, 2, segs, 0.25);
    expect(p).toEqual({ x: 0, z: 2 });
  });

  it("벽에 너무 가까우면 법선 방향으로 밀어낸다", () => {
    const segs = [{ x1: -3, z1: 0, x2: 3, z2: 0 }];
    const p = resolveCollision(0, 0.05, segs, 0.25);
    expect(p.z).toBeGreaterThanOrEqual(0.25 + WALL_THICKNESS_M / 2 - 1e-6);
    expect(p.x).toBeCloseTo(0);
  });

  it("세그먼트 끝점 바깥(개구부 구간)에서는 밀어내지 않는다", () => {
    const segs = [{ x1: -3, z1: 0, x2: -1, z2: 0 }];
    const p = resolveCollision(0, 0.05, segs, 0.25);
    expect(p).toEqual({ x: 0, z: 0.05 });
  });
});
