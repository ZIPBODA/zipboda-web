import { describe, it, expect } from "vitest";
import { simplifyPolyline } from "./douglasPeucker";

describe("simplifyPolyline", () => {
  it("일직선 위의 중간점을 제거한다", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 0.5 },
      { x: 10, y: 0 },
      { x: 20, y: 0 }
    ];
    expect(simplifyPolyline(points, 2)).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 }
    ]);
  });

  it("허용 오차보다 큰 꺾임은 유지한다", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 }
    ];
    expect(simplifyPolyline(points, 2)).toEqual(points);
  });

  it("점이 2개 이하면 그대로 반환한다", () => {
    const two = [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ];
    expect(simplifyPolyline(two)).toEqual(two);
  });
});
