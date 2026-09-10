import { describe, it, expect } from "vitest";
import { findRoomRegions, interiorRegions } from "./roomRegions";
import type { MaskImage } from "../model/types";

function makeMask(width: number, height: number, paint: (x: number, y: number) => boolean): MaskImage {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (paint(x, y)) data[y * width + x] = 1;
  return { data, width, height };
}

// 40×30: 외곽 벽(테두리 2px) + 중앙 세로 벽(x=19..20) → 좌·우 두 방
const twoRoomMask = () =>
  makeMask(40, 30, (x, y) => {
    const isBorder = x < 2 || y < 2 || x >= 38 || y >= 28;
    const isDivider = 19 <= x && x <= 20 && 2 <= y && y < 28;
    return isBorder || isDivider;
  });

describe("findRoomRegions", () => {
  it("벽으로 나뉜 두 방을 별개 영역으로 찾는다", () => {
    const rooms = interiorRegions(findRoomRegions(twoRoomMask(), 0.01));
    expect(rooms).toHaveLength(2);
    const [left, right] = [...rooms].sort((a, b) => a.bbox.minX - b.bbox.minX);
    expect(left.bbox).toEqual({ minX: 2, minY: 2, maxX: 18, maxY: 27 });
    expect(right.bbox).toEqual({ minX: 21, minY: 2, maxX: 37, maxY: 27 });
    expect(left.areaPx).toBe(17 * 26);
  });

  it("가장자리에 닿는 외부 배경은 touchesBorder로 표시된다", () => {
    // 벽이 이미지 안쪽에 떠 있어 바깥 배경이 생기는 경우
    const mask = makeMask(40, 30, (x, y) => (5 <= x && x <= 34 && (y === 5 || y === 24)) || (5 <= y && y <= 24 && (x === 5 || x === 34)));
    const regions = findRoomRegions(mask, 0.01);
    expect(regions.some((r) => r.touchesBorder)).toBe(true);
    expect(interiorRegions(regions)).toHaveLength(1);
  });

  it("최소 면적 비율 미만의 작은 구멍은 버린다", () => {
    const mask = makeMask(40, 30, (x, y) => !(10 <= x && x <= 11 && 10 <= y && y <= 11));
    expect(findRoomRegions(mask, 0.01)).toHaveLength(0);
  });
});
