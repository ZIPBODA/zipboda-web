import { describe, it, expect } from "vitest";
import type { MaskImage, RgbaImage, WallSegmentPx } from "../model/types";
import { furnitureOpenRadius, segmentRooms, wallThicknessMedianPx } from "./segmentRooms";

const SIZE = 120;
const WALL_PX = 10;
const MM_PER_PX = 10;

const blankImage = (): RgbaImage => ({
  width: SIZE,
  height: SIZE,
  data: new Uint8ClampedArray(SIZE * SIZE * 4).fill(255)
});

function paintRect(mask: MaskImage, x0: number, y0: number, x1: number, y1: number) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) mask.data[y * mask.width + x] = 1;
}

/** 테두리 외벽 + 가운데 가로 내벽(두께 10px = 100mm)으로 방 두 개를 만든 마스크 */
function twoRoomMask(): MaskImage {
  const mask: MaskImage = { width: SIZE, height: SIZE, data: new Uint8Array(SIZE * SIZE) };
  paintRect(mask, 0, 0, SIZE, WALL_PX);
  paintRect(mask, 0, SIZE - WALL_PX, SIZE, SIZE);
  paintRect(mask, 0, 0, WALL_PX, SIZE);
  paintRect(mask, SIZE - WALL_PX, 0, SIZE, SIZE);
  paintRect(mask, 0, 55, SIZE, 55 + WALL_PX);
  return mask;
}

const wallSegments = (): WallSegmentPx[] => [
  { a: { x: 0, y: 5 }, b: { x: SIZE, y: 5 }, thicknessPx: WALL_PX },
  { a: { x: 0, y: SIZE - 5 }, b: { x: SIZE, y: SIZE - 5 }, thicknessPx: WALL_PX },
  { a: { x: 5, y: 0 }, b: { x: 5, y: SIZE }, thicknessPx: WALL_PX },
  { a: { x: SIZE - 5, y: 0 }, b: { x: SIZE - 5, y: SIZE }, thicknessPx: WALL_PX },
  { a: { x: 0, y: 60 }, b: { x: SIZE, y: 60 }, thicknessPx: WALL_PX }
];

const run = (mask: MaskImage) =>
  segmentRooms({ mask, image: blankImage(), crop: { x: 0, y: 0, width: SIZE, height: SIZE }, segments: wallSegments(), mmPerPx: MM_PER_PX });

describe("furnitureOpenRadius", () => {
  it("최소 벽 두께보다 얇은 선만 지우는 반지름을 고른다", () => {
    // 10mm/px → 60mm = 6px. 반지름 2로 열면 5px 미만이 사라지고 6px 벽은 남는다
    expect(furnitureOpenRadius(10)).toBe(2);
  });

  it("벽 한 줄이 1px도 안 되는 저해상도에서는 아무것도 지우지 않는다", () => {
    expect(furnitureOpenRadius(200)).toBe(0);
  });
});

describe("wallThicknessMedianPx", () => {
  it("가구 윤곽을 빼고 실제 벽만으로 중앙값을 낸다", () => {
    const segments: WallSegmentPx[] = [1, 2, 3, 4, 12, 14, 16].map((thicknessPx) => ({
      a: { x: 0, y: 0 },
      b: { x: 10, y: 0 },
      thicknessPx
    }));
    expect(wallThicknessMedianPx(segments, 10)).toBe(14);
  });

  it("벽이 하나도 없으면 전체 중앙값으로 물러선다", () => {
    const segments: WallSegmentPx[] = [1, 2, 3].map((thicknessPx) => ({ a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, thicknessPx }));
    expect(wallThicknessMedianPx(segments, 10)).toBe(2);
  });
});

describe("segmentRooms", () => {
  it("두께 100mm 이상인 벽은 방을 나눈다", () => {
    expect(run(twoRoomMask())).toHaveLength(2);
  });

  it("침대·주방가구 같은 가는 윤곽선은 방을 나누지 않는다", () => {
    const mask = twoRoomMask();
    // 위쪽 방을 가로지르는 3px(30mm) 세로선 — 도면의 가구 윤곽 굵기
    paintRect(mask, 60, WALL_PX, 63, 55);
    expect(run(mask)).toHaveLength(2);
  });

  it("가구 윤곽이 지워져 방 면적이 그대로 남는다", () => {
    const before = run(twoRoomMask());
    const mask = twoRoomMask();
    // 위쪽 방 안에 그려 넣은 침대 윤곽(속이 빈 사각형)
    paintRect(mask, 30, 20, 80, 23);
    paintRect(mask, 30, 45, 80, 48);
    paintRect(mask, 30, 20, 33, 48);
    paintRect(mask, 77, 20, 80, 48);
    const after = run(mask);
    expect(after).toHaveLength(2);
    expect(after[0].areaPx).toBe(before[0].areaPx);
  });
});

describe("segmentRooms 색 경계 조각", () => {
  it("색 경계로만 떨어진 1㎡ 미만 조각은 옆방에 다시 붙인다", () => {
    // 아래쪽 방(60×100px = 6㎡)에 폭 8px(0.8m) 띠 색을 넣어 위쪽 0.6㎡ 조각을 만든다
    const mask = twoRoomMask();
    const image = blankImage();
    for (let y = 70; y < SIZE - WALL_PX; y++)
      for (let x = WALL_PX; x < SIZE - WALL_PX; x++) {
        const i = (y * SIZE + x) * 4;
        image.data[i] = 200;
        image.data[i + 1] = 40;
        image.data[i + 2] = 40;
      }
    const regions = segmentRooms({ mask, image, crop: { x: 0, y: 0, width: SIZE, height: SIZE }, segments: wallSegments(), mmPerPx: MM_PER_PX });
    expect(regions).toHaveLength(2);
  });
});
