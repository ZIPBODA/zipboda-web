import { describe, it, expect } from "vitest";
import { RASTER_MARGIN_PX, RASTER_MM_PER_PX } from "../config/constants";
import { rasterizeWalls } from "./rasterizeWalls";

const at = (mask: { data: Uint8Array; width: number }, x: number, y: number) => mask.data[y * mask.width + x];

describe("rasterizeWalls", () => {
  it("벽이 없으면 null", () => {
    expect(rasterizeWalls([])).toBeNull();
  });

  it("격자 위 좌표는 픽셀 중심에 떨어지고 여백만큼 안쪽에 그려진다", () => {
    const raster = rasterizeWalls([{ a: { x: 0, z: 0 }, b: { x: 500, z: 0 } }]);
    if (!raster) throw new Error("raster");
    expect(raster.pxOf({ x: 0, z: 0 })).toEqual({ x: RASTER_MARGIN_PX, y: RASTER_MARGIN_PX });
    // 픽셀 중심 = 모서리 + 반 픽셀 → 원점 좌표로 되돌아온다
    const corner = raster.mmOfCorner({ x: RASTER_MARGIN_PX, y: RASTER_MARGIN_PX });
    expect(corner.x + RASTER_MM_PER_PX / 2).toBe(0);
    expect(raster.mask.width).toBe(500 / RASTER_MM_PER_PX + 2 * RASTER_MARGIN_PX + 1);
  });

  it("수평·수직 벽이 만나는 모서리 픽셀을 둘 다 칠한다", () => {
    const raster = rasterizeWalls([
      { a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
      { a: { x: 1000, z: 0 }, b: { x: 1000, z: 1000 } }
    ]);
    if (!raster) throw new Error("raster");
    const corner = raster.pxOf({ x: 1000, z: 0 });
    expect(at(raster.mask, corner.x, corner.y)).toBe(1);
    expect(at(raster.mask, corner.x - 1, corner.y)).toBe(1);
    expect(at(raster.mask, corner.x, corner.y + 1)).toBe(1);
    expect(at(raster.mask, corner.x + 1, corner.y)).toBe(0);
    expect(at(raster.mask, corner.x, corner.y - 1)).toBe(0);
  });
});
