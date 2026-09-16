import { describe, it, expect } from "vitest";
import { isOriented, orientWall, orthogonalize, snapPoint } from "./snap";
import type { TraceWall } from "../model/types";

const walls: TraceWall[] = [{ id: "w1", a: { x: 0, z: 0 }, b: { x: 3000, z: 0 } }];

describe("snapPoint", () => {
  it("허용치 안의 기존 끝점에 붙는다", () => {
    expect(snapPoint({ x: 2960, z: 30 }, walls, 100)).toEqual({ x: 3000, z: 0 });
  });

  it("끝점이 멀면 끝점의 축선에 붙고 나머지는 격자로 간다", () => {
    expect(snapPoint({ x: 2970, z: 1230 }, walls, 100)).toEqual({ x: 3000, z: 1250 });
  });

  it("아무 데도 안 가까우면 50 격자", () => {
    expect(snapPoint({ x: 1234, z: 1276 }, walls, 100)).toEqual({ x: 1250, z: 1300 });
  });
});

describe("orthogonalize", () => {
  it("변위가 큰 축만 남긴다", () => {
    expect(orthogonalize({ x: 500, z: 40 }, { x: 0, z: 0 })).toEqual({ x: 500, z: 0 });
    expect(orthogonalize({ x: 40, z: 500 }, { x: 0, z: 0 })).toEqual({ x: 0, z: 500 });
  });
});

describe("orientWall", () => {
  it("a ≤ b가 되게 돌린다", () => {
    const flipped = { id: "w", a: { x: 3000, z: 0 }, b: { x: 0, z: 0 } };
    expect(isOriented(flipped)).toBe(false);
    expect(orientWall(flipped)).toEqual({ id: "w", a: { x: 0, z: 0 }, b: { x: 3000, z: 0 } });
  });

  it("세로 벽은 z로 비교한다", () => {
    const wall = { id: "w", a: { x: 100, z: 900 }, b: { x: 100, z: 200 } };
    expect(orientWall(wall).a).toEqual({ x: 100, z: 200 });
  });
});
