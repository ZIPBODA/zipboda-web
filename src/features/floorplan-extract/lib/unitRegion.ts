import type { CropRect, MaskImage } from "../model/types";

export interface UnitRegionOptions {
  /** 그룹핑 격자 한 칸의 크기(px). 문·창 틈을 건너뛸 만큼 커야 한다 */
  cellPx: number;
  /** bbox 대비 벽 픽셀 비율 하한 — 이보다 성기면 흩어진 잡음 */
  minFillRatio: number;
  /** 상한 — 이보다 꽉 차면 제목 글자·검은 막대처럼 속이 찬 덩어리 */
  maxFillRatio: number;
  /** 이미지 대비 bbox 면적 하한 */
  minAreaRatio: number;
  /**
   * 굵은 획만 남긴 마스크(열림 결과). 있으면 덩어리 점수와 bbox를 이 픽셀로 잡는다.
   * 도면은 굵은 벽 획이 많고 표·글자·단지배치도는 가는 선이라 여기서 갈린다.
   */
  core?: MaskImage;
}

interface Component {
  bbox: CropRect;
  mass: number;
  fillRatio: number;
}

const cellIndex = (col: number, row: number, cols: number) => row * cols + col;

/** 격자 칸마다 벽 픽셀 수를 센다. 칸 단위로 묶으면 문 틈으로 끊긴 벽도 한 덩어리가 된다 */
function buildOccupancy(mask: MaskImage, cellPx: number) {
  const cols = Math.ceil(mask.width / cellPx);
  const rows = Math.ceil(mask.height / cellPx);
  const counts = new Int32Array(cols * rows);
  for (let y = 0; y < mask.height; y++) {
    const row = Math.floor(y / cellPx);
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[y * mask.width + x] !== 1) continue;
      counts[cellIndex(Math.floor(x / cellPx), row, cols)] += 1;
    }
  }
  return { counts, cols, rows };
}

/** 8방향으로 이어진 칸을 하나의 덩어리로 묶는다 */
function labelComponents(counts: Int32Array, cols: number, rows: number): number[][] {
  const seen = new Uint8Array(counts.length);
  const groups: number[][] = [];
  for (let start = 0; start < counts.length; start++) {
    if (seen[start] === 1 || counts[start] === 0) continue;
    const stack = [start];
    seen[start] = 1;
    const cells: number[] = [];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined) break;
      cells.push(current);
      const col = current % cols;
      const row = Math.floor(current / cols);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nc = col + dc;
          const nr = row + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const next = cellIndex(nc, nr, cols);
          if (seen[next] === 1 || counts[next] === 0) continue;
          seen[next] = 1;
          stack.push(next);
        }
      }
    }
    groups.push(cells);
  }
  return groups;
}

/** 덩어리에 속한 칸 안의 실제 벽 픽셀 수 */
function massInCells(mask: MaskImage, cells: number[], cols: number, cellPx: number): number {
  let mass = 0;
  for (const cell of cells) {
    const x0 = (cell % cols) * cellPx;
    const y0 = Math.floor(cell / cols) * cellPx;
    const x1 = Math.min(x0 + cellPx, mask.width);
    const y1 = Math.min(y0 + cellPx, mask.height);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (mask.data[y * mask.width + x] === 1) mass++;
  }
  return mass;
}

/** 덩어리에 속한 칸 안의 실제 벽 픽셀로 정확한 bbox를 잡는다(격자 해상도 오차 제거) */
function preciseBBox(mask: MaskImage, cells: number[], cols: number, cellPx: number): CropRect | null {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;
  for (const cell of cells) {
    const x0 = (cell % cols) * cellPx;
    const y0 = Math.floor(cell / cols) * cellPx;
    const x1 = Math.min(x0 + cellPx, mask.width);
    const y1 = Math.min(y0 + cellPx, mask.height);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (mask.data[y * mask.width + x] !== 1) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * 벽 마스크에서 유닛(도면) 영역을 찾는다.
 * 카탈로그 페이지에는 제목 글자·표·단지배치도가 섞여 있어 단순히 가장 큰 윤곽을 잡으면 엉뚱한 곳이 걸린다.
 * 벽은 문·창에서 끊기므로 윤곽 하나로 이어지지도 않는다.
 * 그래서 격자로 묶어 끊긴 벽을 한 덩어리로 만든 뒤, 속이 찬 덩어리(글자·막대)를 걸러내고
 * 굵은 획(벽)이 가장 많은 것을 고른다. bbox도 굵은 획으로 잡아 치수선·인출선이 크롭을 넓히지 않게 한다.
 * (bbox 면적으로 고르면 헤더 막대가 있는 면적표가 도면보다 커서 뽑히는 일이 있었다)
 */
export function findUnitRegion(mask: MaskImage, options: UnitRegionOptions): CropRect | null {
  if (mask.width === 0 || mask.height === 0) return null;
  const { counts, cols, rows } = buildOccupancy(mask, options.cellPx);
  const imageArea = mask.width * mask.height;
  const core = options.core ?? mask;

  const candidates: Component[] = [];
  for (const cells of labelComponents(counts, cols, rows)) {
    const bbox = preciseBBox(core, cells, cols, options.cellPx) ?? preciseBBox(mask, cells, cols, options.cellPx);
    if (bbox === null) continue;
    const mass = cells.reduce((sum, cell) => sum + counts[cell], 0);
    const bboxArea = bbox.width * bbox.height;
    const fillRatio = mass / bboxArea;
    const bigEnough = bboxArea / imageArea >= options.minAreaRatio;
    const sparseEnough = options.minFillRatio <= fillRatio && fillRatio <= options.maxFillRatio;
    if (bigEnough && sparseEnough) candidates.push({ bbox, mass: massInCells(core, cells, cols, options.cellPx), fillRatio });
  }

  if (candidates.length === 0) return null;
  candidates.sort((p, q) => q.mass - p.mass || q.bbox.width * q.bbox.height - p.bbox.width * p.bbox.height);
  return candidates[0].bbox;
}
