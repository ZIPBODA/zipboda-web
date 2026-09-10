import { ROOM_MIN_AREA_RATIO } from "../config/constants";
import type { MaskImage, RoomRegion } from "../model/types";

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
] as const;

/**
 * 벽 마스크의 빈 공간(0)을 4-연결 성분으로 나눠 방 영역을 얻는다.
 * 이미지 가장자리에 닿는 성분은 외부 배경이므로 표시만 하고 호출 측에서 제외한다.
 */
export function findRoomRegions(wallMask: MaskImage, minAreaRatio = ROOM_MIN_AREA_RATIO): RoomRegion[] {
  const { width, height, data } = wallMask;
  const visited = new Uint8Array(width * height);
  const minArea = width * height * minAreaRatio;
  const regions: RoomRegion[] = [];
  const stack: number[] = [];

  for (let seed = 0; seed < data.length; seed++) {
    const isFreeUnvisited = data[seed] === 0 && visited[seed] === 0;
    if (!isFreeUnvisited) continue;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let areaPx = 0;
    let touchesBorder = false;

    visited[seed] = 1;
    stack.push(seed);
    while (stack.length) {
      const idx = stack.pop();
      if (idx === undefined) break;
      const x = idx % width;
      const y = (idx - x) / width;
      areaPx++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;

      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        const inBounds = 0 <= nx && nx < width && 0 <= ny && ny < height;
        if (!inBounds) continue;
        const nIdx = ny * width + nx;
        if (data[nIdx] === 0 && visited[nIdx] === 0) {
          visited[nIdx] = 1;
          stack.push(nIdx);
        }
      }
    }

    if (areaPx >= minArea) {
      regions.push({ id: `region-${regions.length}`, bbox: { minX, minY, maxX, maxY }, areaPx, touchesBorder });
    }
  }
  return regions;
}

export const interiorRegions = (regions: RoomRegion[]): RoomRegion[] => regions.filter((r) => !r.touchesBorder);
