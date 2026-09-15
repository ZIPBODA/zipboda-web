import type { CropRect, MaskImage, RgbaImage } from "../model/types";

const CHANNELS = 4;

interface BlockGrid {
  mean: Int32Array;
  cols: number;
  rows: number;
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
 */
export function colorBoundaryMask(
  image: RgbaImage,
  crop: CropRect,
  blockPx: number,
  threshold: number,
  minRunRatio: number
): MaskImage {
  const mask: MaskImage = { data: new Uint8Array(crop.width * crop.height), width: crop.width, height: crop.height };
  if (crop.width <= 0 || crop.height <= 0) return mask;
  const { mean, cols, rows } = blockMeans(image, crop, blockPx);

  const paintRow = (y: number, x0: number, x1: number) => {
    if (y < 0 || y >= crop.height) return;
    for (let x = Math.max(0, x0); x < Math.min(x1, crop.width); x++) mask.data[y * crop.width + x] = 1;
  };
  const paintCol = (x: number, y0: number, y1: number) => {
    if (x < 0 || x >= crop.width) return;
    for (let y = Math.max(0, y0); y < Math.min(y1, crop.height); y++) mask.data[y * crop.width + x] = 1;
  };

  // 가로 경계: 아래 블록과 색이 다른 칸을 줄 단위로 모아 긴 구간만 남긴다
  const minRunCols = Math.max(1, Math.round(cols * minRunRatio));
  for (let row = 0; row + 1 < rows; row++) {
    const flags = Array.from({ length: cols }, (_, col) => colorDistance(mean, row * cols + col, (row + 1) * cols + col) > threshold);
    for (const run of edgeRuns(flags)) {
      if (run.end - run.start + 1 < minRunCols) continue;
      paintRow((row + 1) * blockPx, run.start * blockPx, (run.end + 1) * blockPx);
    }
  }

  // 세로 경계
  const minRunRows = Math.max(1, Math.round(rows * minRunRatio));
  for (let col = 0; col + 1 < cols; col++) {
    const flags = Array.from({ length: rows }, (_, row) => colorDistance(mean, row * cols + col, row * cols + col + 1) > threshold);
    for (const run of edgeRuns(flags)) {
      if (run.end - run.start + 1 < minRunRows) continue;
      paintCol((col + 1) * blockPx, run.start * blockPx, (run.end + 1) * blockPx);
    }
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
