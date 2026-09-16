import { DOUGLAS_PEUCKER_EPSILON_PX, ROOM_MIN_AREA_RATIO } from "../config/constants";
import type { LabeledRegions, MaskImage, RoomRegion } from "../model/types";
import { traceRegionOutline } from "./regionOutline";
import { simplifyPolyline } from "./douglasPeucker";

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
  return labelRoomRegions(wallMask, minAreaRatio).regions;
}

/**
 * findRoomRegions와 같되, 어느 픽셀이 어느 방인지도 돌려준다.
 * simplifyEpsilonPx=0이면 윤곽을 단순화하지 않는다 — 격자에 정렬된 마스크(수기 트레이서)는 꼭짓점을 잃으면 안 된다
 */
export function labelRoomRegions(
  wallMask: MaskImage,
  minAreaRatio = ROOM_MIN_AREA_RATIO,
  simplifyEpsilonPx = DOUGLAS_PEUCKER_EPSILON_PX
): LabeledRegions {
  const { width, height, data } = wallMask;
  const visited = new Uint8Array(width * height);
  // 영역 번호를 기록해 두면 윤곽 추적에서 "이 픽셀이 이 방인가"를 바로 물을 수 있다
  const labels = new Int32Array(width * height).fill(-1);
  const minArea = width * height * minAreaRatio;
  const regions: RoomRegion[] = [];
  const owner = new Int32Array(width * height).fill(-1);
  const stack: number[] = [];
  // 성분마다 새 번호를 준다. 면적 미달로 버린 성분의 번호를 다음 성분이 물려받으면 그 픽셀까지 같은 방으로 읽힌다
  let nextLabel = 0;

  for (let seed = 0; seed < data.length; seed++) {
    const isFreeUnvisited = data[seed] === 0 && visited[seed] === 0;
    if (!isFreeUnvisited) continue;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let touchesBorder = false;
    const pixels: number[] = [];

    const label = nextLabel++;
    visited[seed] = 1;
    labels[seed] = label;
    stack.push(seed);
    while (stack.length) {
      const idx = stack.pop();
      if (idx === undefined) break;
      const x = idx % width;
      const y = (idx - x) / width;
      pixels.push(idx);
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
          labels[nIdx] = label;
          stack.push(nIdx);
        }
      }
    }

    const areaPx = pixels.length;
    if (areaPx >= minArea) {
      const inRegion = (x: number, y: number) =>
        0 <= x && x < width && 0 <= y && y < height && labels[y * width + x] === label;
      for (const idx of pixels) owner[idx] = regions.length;
      regions.push({
        id: `region-${regions.length}`,
        bbox: { minX, minY, maxX, maxY },
        // 픽셀 단위 윤곽은 계단처럼 들쭉날쭉하다 — 단순화해 꼭짓점만 남긴다(정규화가 직교로 스냅한다)
        polygon: simplifyPolyline(traceRegionOutline(inRegion, minX, minY, maxX, maxY), simplifyEpsilonPx),
        areaPx,
        touchesBorder
      });
    }
  }
  return { regions, owner };
}

export const interiorRegions = (regions: RoomRegion[]): RoomRegion[] => regions.filter((r) => !r.touchesBorder);
