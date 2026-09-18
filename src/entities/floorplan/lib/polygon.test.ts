import { describe, it, expect } from "vitest";
import { pointInPolygon, polygonCentroid, polygonInteriorPoint } from "./polygon";

const square = [
  { x: 0, z: 0 },
  { x: 10, z: 0 },
  { x: 10, z: 10 },
  { x: 0, z: 10 }
];

// 10×10에서 오른쪽 아래 6×6을 덜어낸 ㄱ자
const lShape = [
  { x: 0, z: 0 },
  { x: 10, z: 0 },
  { x: 10, z: 4 },
  { x: 4, z: 4 },
  { x: 4, z: 10 },
  { x: 0, z: 10 }
];

describe("pointInPolygon", () => {
  it("안쪽 점은 참, 바깥 점은 거짓", () => {
    expect(pointInPolygon({ x: 5, z: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 11, z: 5 }, square)).toBe(false);
    expect(pointInPolygon({ x: 5, z: -1 }, square)).toBe(false);
  });

  it("경계 위의 점은 안으로 친다", () => {
    expect(pointInPolygon({ x: 10, z: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 0, z: 0 }, square)).toBe(true);
  });

  it("ㄱ자의 덜어낸 부분은 바깥이다", () => {
    expect(pointInPolygon({ x: 7, z: 7 }, lShape)).toBe(false);
    expect(pointInPolygon({ x: 2, z: 7 }, lShape)).toBe(true);
    expect(pointInPolygon({ x: 7, z: 2 }, lShape)).toBe(true);
  });
});

describe("polygonCentroid", () => {
  it("직사각형은 중심", () => {
    expect(polygonCentroid(square)).toEqual({ x: 5, z: 5 });
  });

  it("L자 폴리곤의 면적 가중 중심을 계산한다", () => {
    const c = polygonCentroid([
      { x: 0, z: 0 },
      { x: 2, z: 0 },
      { x: 2, z: 1 },
      { x: 1, z: 1 },
      { x: 1, z: 2 },
      { x: 0, z: 2 }
    ]);
    expect(c.x).toBeCloseTo(5 / 6);
    expect(c.z).toBeCloseTo(5 / 6);
  });

  it("퇴화 폴리곤은 bbox 중심으로 대체한다", () => {
    expect(polygonCentroid([{ x: 0, z: 0 }, { x: 4, z: 0 }])).toEqual({ x: 2, z: 0 });
  });
});

describe("polygonInteriorPoint", () => {
  it("볼록한 방은 무게중심 그대로", () => {
    expect(polygonInteriorPoint(square)).toEqual({ x: 5, z: 5 });
  });

  it("ㄱ자 방에서는 방 밖으로 나가지 않는다", () => {
    // 이 ㄱ자의 무게중심은 (2.2, 2.2)로 패인 자리에 떨어진다
    const notch = [
      { x: 0, z: 0 },
      { x: 6, z: 0 },
      { x: 6, z: 2 },
      { x: 2, z: 2 },
      { x: 2, z: 6 },
      { x: 0, z: 6 }
    ];
    expect(pointInPolygon(polygonCentroid(notch), notch)).toBe(false);
    expect(pointInPolygon(polygonInteriorPoint(notch), notch)).toBe(true);
  });

  it("ㄷ자 방도 안쪽을 고른다", () => {
    const u = [
      { x: 0, z: 0 },
      { x: 2, z: 0 },
      { x: 2, z: 4 },
      { x: 4, z: 4 },
      { x: 4, z: 0 },
      { x: 6, z: 0 },
      { x: 6, z: 6 },
      { x: 0, z: 6 }
    ];
    expect(pointInPolygon(polygonInteriorPoint(u), u)).toBe(true);
  });
});
