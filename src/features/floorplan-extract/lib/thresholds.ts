import { INK_OTSU_MIN_MARGIN, INK_SPLIT_RATIO, WALL_BLACK_PERCENTILE, WALL_DARK_RATIO, WALL_WHITE_PERCENTILE } from "../config/constants";

export interface WallThresholds {
  /** 이 밝기 이하를 "어두운 픽셀"(벽 후보)로 본다 */
  dark: number;
  /** 이 밝기 이하를 "검정 잉크"로 본다. 갈색·회색 가구는 위쪽에 남는다 */
  ink: number;
}

const GRAY_LEVELS = 256;

function histogram(gray: Uint8Array | Uint8ClampedArray): Uint32Array {
  const hist = new Uint32Array(GRAY_LEVELS);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  return hist;
}

function percentile(hist: Uint32Array, total: number, ratio: number): number {
  const target = total * ratio;
  let acc = 0;
  for (let level = 0; level < GRAY_LEVELS; level++) {
    acc += hist[level];
    if (acc >= target) return level;
  }
  return GRAY_LEVELS - 1;
}

/** [0, upper] 구간 히스토그램에서 클래스 간 분산을 최대로 하는 Otsu 경계 */
function otsuSplit(hist: Uint32Array, upper: number): number {
  let total = 0;
  let sum = 0;
  for (let level = 0; level <= upper; level++) {
    total += hist[level];
    sum += level * hist[level];
  }
  if (total === 0) return upper;
  let best = upper;
  let bestVariance = -1;
  let countBelow = 0;
  let sumBelow = 0;
  for (let level = 0; level < upper; level++) {
    countBelow += hist[level];
    sumBelow += level * hist[level];
    const countAbove = total - countBelow;
    if (countBelow === 0 || countAbove === 0) continue;
    const meanBelow = sumBelow / countBelow;
    const meanAbove = (sum - sumBelow) / countAbove;
    const variance = countBelow * countAbove * (meanBelow - meanAbove) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      best = level;
    }
  }
  return best;
}

/**
 * 도면 크롭의 밝기 분포에서 벽 임계를 정한다.
 *
 * 스캔마다 검정이 20에도 60에도 찍히고 종이 흰색도 다르므로 고정 임계는 한 장에만 맞는다.
 * 어두운 쪽은 검정점과 흰점 사이 비율로, 잉크는 어두운 픽셀만 모아 Otsu로 벽(검정)과
 * 가구(갈색·회색)의 골을 찾는다. 골이 검정점에 너무 붙으면(가구가 없어 단봉) 중간값으로 물러선다.
 */
export function wallThresholds(gray: Uint8Array | Uint8ClampedArray): WallThresholds {
  const hist = histogram(gray);
  const black = percentile(hist, gray.length, WALL_BLACK_PERCENTILE);
  const white = percentile(hist, gray.length, WALL_WHITE_PERCENTILE);
  const dark = Math.round(black + (white - black) * WALL_DARK_RATIO);

  const split = otsuSplit(hist, dark);
  const midpoint = Math.round(black + (dark - black) * INK_SPLIT_RATIO);
  const isBimodal = black + INK_OTSU_MIN_MARGIN <= split && split <= dark - INK_OTSU_MIN_MARGIN;
  return { dark, ink: isBimodal ? split : midpoint };
}
