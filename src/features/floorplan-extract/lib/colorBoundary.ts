import {
  COLOR_BOUNDARY_MAX_EXTEND_RATIO,
  COLOR_BOUNDARY_MAX_WALL_FRACTION,
  COLOR_BOUNDARY_PERCENTILE,
  COLOR_BOUNDARY_RATIO,
  COLOR_BOUNDARY_WALL_TO_WALL_MIN_MM
} from "../config/constants";
import type { CropRect, MaskImage, RgbaImage } from "../model/types";

const CHANNELS = 4;

interface BlockGrid {
  mean: Int32Array;
  cols: number;
  rows: number;
}

/** 블록마다 벽 픽셀 비율을 낸다. 벽이 낀 블록 사이의 색 차이는 바닥 경계가 아니다 */
function blockWallFractions(walls: MaskImage | undefined, crop: CropRect, blockPx: number, cols: number, rows: number): Float32Array {
  const fraction = new Float32Array(cols * rows);
  if (!walls) return fraction;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let on = 0;
      let count = 0;
      const y1 = Math.min((row + 1) * blockPx, crop.height, walls.height);
      const x1 = Math.min((col + 1) * blockPx, crop.width, walls.width);
      for (let y = row * blockPx; y < y1; y++) {
        for (let x = col * blockPx; x < x1; x++) {
          count++;
          if (walls.data[y * walls.width + x] === 1) on++;
        }
      }
      fraction[row * cols + col] = count === 0 ? 0 : on / count;
    }
  }
  return fraction;
}

/** 블록마다 평균 RGB를 낸다. 나뭇결·타일 무늬는 평균에 묻혀 사라진다 */
function blockMeans(image: RgbaImage, crop: CropRect, blockPx: number): BlockGrid {
  const cols = Math.ceil(crop.width / blockPx);
  const rows = Math.ceil(crop.height / blockPx);
  const mean = new Int32Array(cols * rows * 3);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      const y1 = Math.min((row + 1) * blockPx, crop.height);
      const x1 = Math.min((col + 1) * blockPx, crop.width);
      for (let y = row * blockPx; y < y1; y++) {
        const imageY = crop.y + y;
        if (imageY < 0 || imageY >= image.height) continue;
        for (let x = col * blockPx; x < x1; x++) {
          const imageX = crop.x + x;
          if (imageX < 0 || imageX >= image.width) continue;
          const i = (imageY * image.width + imageX) * CHANNELS;
          r += image.data[i];
          g += image.data[i + 1];
          b += image.data[i + 2];
          count++;
        }
      }
      const at = (row * cols + col) * 3;
      if (count > 0) {
        mean[at] = Math.round(r / count);
        mean[at + 1] = Math.round(g / count);
        mean[at + 2] = Math.round(b / count);
      }
    }
  }
  return { mean, cols, rows };
}

const colorDistance = (mean: Int32Array, a: number, b: number) =>
  Math.hypot(mean[a * 3] - mean[b * 3], mean[a * 3 + 1] - mean[b * 3 + 1], mean[a * 3 + 2] - mean[b * 3 + 2]);

/** 이웃 블록 거리 분포의 상위 백분위 × 비율. 스캔 밝기·대비가 달라도 "이 도면에서 큰 차이"를 같은 기준으로 잡는다 */
function adaptiveThreshold(mean: Int32Array, cols: number, rows: number): number {
  const distances: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const at = row * cols + col;
      if (row + 1 < rows) distances.push(colorDistance(mean, at, at + cols));
      if (col + 1 < cols) distances.push(colorDistance(mean, at, at + 1));
    }
  }
  if (distances.length === 0) return 0;
  distances.sort((a, b) => a - b);
  return distances[Math.min(distances.length - 1, Math.floor(distances.length * COLOR_BOUNDARY_PERCENTILE))] * COLOR_BOUNDARY_RATIO;
}

/** 한 줄에서 연속으로 이어진 경계 구간을 찾는다 */
function edgeRuns(flags: boolean[]): Array<{ start: number; end: number }> {
  const runs: Array<{ start: number; end: number }> = [];
  let start = -1;
  for (let i = 0; i <= flags.length; i++) {
    const on = i < flags.length && flags[i];
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      runs.push({ start, end: i - 1 });
      start = -1;
    }
  }
  return runs;
}

/**
 * 바닥 마감재가 바뀌는 선을 방 경계로 찾아 마스크로 돌려준다.
 * 벽 없이 바닥 색만 바뀌는 경계(주방↔거실 등)는 벽 검출로는 잡히지 않아 두 방이 한 덩어리가 된다.
 * 블록 평균끼리 비교해 무늬 노이즈를 걸러내고, 차이가 큰 경계에만 선을 긋는다.
 *
 * 다만 가구·설비도 바닥과 색이 달라 경계가 생긴다. 그 조각까지 벽으로 삼으면 방이 잘게 쪼개져
 * 면적을 잃으므로, 한 줄로 길게 이어진 구간만 방 경계로 인정한다.
 *
 * 인정한 구간의 끝이 벽(walls)에서 조금 모자라면 벽에 닿을 때까지 늘린다. 방 경계는 벽에서 벽까지 이어지는데,
 * 냉장고·싱크대처럼 회색 가구가 놓인 끝부분은 색 차가 작아 구간이 짧게 끊기고 그 틈으로 방이 샌다.
 * 크게 모자라는 구간(가구 둘레·발코니 확장선)은 방 경계가 아니므로 그대로 둔다.
 */
export function colorBoundaryMask(
  image: RgbaImage,
  crop: CropRect,
  blockPx: number,
  minThreshold: number,
  minRunRatio: number,
  walls?: MaskImage,
  mmPerPx?: number
): MaskImage {
  const mask: MaskImage = { data: new Uint8Array(crop.width * crop.height), width: crop.width, height: crop.height };
  if (crop.width <= 0 || crop.height <= 0) return mask;
  const { mean, cols, rows } = blockMeans(image, crop, blockPx);
  const wallFraction = blockWallFractions(walls, crop, blockPx, cols, rows);
  const threshold = Math.max(minThreshold, adaptiveThreshold(mean, cols, rows));
  const isWall = (x: number, y: number) => walls !== undefined && walls.data[y * walls.width + x] === 1;
  const isFloorEdge = (a: number, b: number) =>
    wallFraction[a] <= COLOR_BOUNDARY_MAX_WALL_FRACTION &&
    wallFraction[b] <= COLOR_BOUNDARY_MAX_WALL_FRACTION &&
    colorDistance(mean, a, b) > threshold;

  /** [from, to) 구간을 벽까지 늘린다. 벽이 허용 틈 안에 없으면 원래 끝을 지킨다 */
  const extendToWalls = (from: number, to: number, extent: number, wallAt: (pos: number) => boolean) => {
    const maxExtend = Math.round(extent * COLOR_BOUNDARY_MAX_EXTEND_RATIO);
    let start = from;
    while (start > 0 && from - start < maxExtend && !wallAt(start - 1)) start--;
    const reachedStart = start === 0 || wallAt(start - 1);
    let end = to;
    while (end < extent && end - to < maxExtend && !wallAt(end)) end++;
    const reachedEnd = end === extent || wallAt(end);
    return { from: reachedStart ? start : from, to: reachedEnd ? end : to, wallToWall: reachedStart && reachedEnd };
  };
  const minWallToWallPx = mmPerPx ? COLOR_BOUNDARY_WALL_TO_WALL_MIN_MM / mmPerPx : Number.POSITIVE_INFINITY;
  /** 축 길이 비율을 채웠거나, 문 폭보다 길고 양 끝이 벽에 닿으면 방 경계다 */
  const qualifies = (lengthPx: number, minRunPx: number, wallToWall: boolean) => lengthPx >= minRunPx || (wallToWall && lengthPx >= minWallToWallPx);
  const paintRow = (y: number, x0: number, x1: number, minRunPx: number) => {
    if (y < 0 || y >= crop.height) return;
    const { from, to, wallToWall } = extendToWalls(Math.max(0, x0), Math.min(x1, crop.width), crop.width, (x) => isWall(x, y));
    if (!qualifies(x1 - x0, minRunPx, wallToWall)) return;
    for (let x = from; x < to; x++) mask.data[y * crop.width + x] = 1;
  };
  const paintCol = (x: number, y0: number, y1: number, minRunPx: number) => {
    if (x < 0 || x >= crop.width) return;
    const { from, to, wallToWall } = extendToWalls(Math.max(0, y0), Math.min(y1, crop.height), crop.height, (y) => isWall(x, y));
    if (!qualifies(y1 - y0, minRunPx, wallToWall)) return;
    for (let y = from; y < to; y++) mask.data[y * crop.width + x] = 1;
  };

  // 가로 경계: 아래 블록과 색이 다른 칸을 줄 단위로 모은다
  const minRunCols = Math.max(1, Math.round(cols * minRunRatio));
  for (let row = 0; row + 1 < rows; row++) {
    const flags = Array.from({ length: cols }, (_, col) => isFloorEdge(row * cols + col, (row + 1) * cols + col));
    for (const run of edgeRuns(flags)) paintRow((row + 1) * blockPx, run.start * blockPx, (run.end + 1) * blockPx, minRunCols * blockPx);
  }

  // 세로 경계
  const minRunRows = Math.max(1, Math.round(rows * minRunRatio));
  for (let col = 0; col + 1 < cols; col++) {
    const flags = Array.from({ length: rows }, (_, row) => isFloorEdge(row * cols + col, row * cols + col + 1));
    for (const run of edgeRuns(flags)) paintCol((col + 1) * blockPx, run.start * blockPx, (run.end + 1) * blockPx, minRunRows * blockPx);
  }
  return mask;
}

/** 두 마스크를 합친다(어느 쪽이든 벽이면 벽) */
export function unionMask(base: MaskImage, extra: MaskImage): MaskImage {
  const out: MaskImage = { data: Uint8Array.from(base.data), width: base.width, height: base.height };
  const size = Math.min(out.data.length, extra.data.length);
  for (let i = 0; i < size; i++) if (extra.data[i] === 1) out.data[i] = 1;
  return out;
}
