import { describe, it, expect } from "vitest";
import { topDimensionBand } from "./extractFloorplan";

// 실도면(test2.jpg) 실측: 크롭 x989 y892 330x713, 가로 치수 숫자는 y 591~632에 인쇄돼 있다
const crop = { x: 989, y: 892, width: 330, height: 713 };
const IMAGE_WIDTH = 1653;

describe("topDimensionBand", () => {
  it("도면 위쪽 치수 숫자가 들어올 만큼 높게 잡는다", () => {
    const band = topDimensionBand(crop, IMAGE_WIDTH);
    expect(band.y).toBeLessThanOrEqual(591);
    expect(band.y + band.height).toBe(crop.y);
  });

  it("좌우 세로 치수 열이 섞이지 않게 폭은 크롭에 붙여 잡는다", () => {
    const band = topDimensionBand(crop, IMAGE_WIDTH);
    // 좌측 세로 치수 열(x≈730)은 제외되어야 한다
    expect(band.x).toBeGreaterThan(730);
    expect(band.x + band.width).toBeLessThan(crop.x + crop.width + crop.width);
  });

  it("이미지 위쪽 경계를 넘지 않는다", () => {
    const band = topDimensionBand({ x: 10, y: 30, width: 100, height: 400 }, IMAGE_WIDTH);
    expect(band.y).toBe(0);
    expect(band.height).toBe(30);
  });

  it("이미지 오른쪽 경계를 넘지 않는다", () => {
    const band = topDimensionBand({ x: 1600, y: 500, width: 50, height: 200 }, IMAGE_WIDTH);
    expect(band.x + band.width).toBeLessThanOrEqual(IMAGE_WIDTH);
  });
});
