import {
  DIMENSION_CHAIN_SUM_TOLERANCE,
  DIMENSION_MAX_MM,
  DIMENSION_MIN_MM,
  DIMENSION_SUBSET_MAX,
  SCALE_CHAIN_CONFIDENCE,
  SCALE_AREA_CONFIDENCE,
  SCALE_CHAIN_PARTITION_CONFIDENCE,
  SCALE_MAX_FALLBACK_CONFIDENCE
} from "../config/constants";
import type { ScaleEstimate } from "../model/types";

const MM2_PER_M2 = 1_000_000;

function findSubsetSummingTo(values: number[], target: number): number[] | null {
  const limited = values.slice(0, DIMENSION_SUBSET_MAX);
  const total = 1 << limited.length;
  for (let mask = 1; mask < total; mask++) {
    const subset = limited.filter((_, i) => mask & (1 << i));
    if (subset.length < 2) continue;
    const sum = subset.reduce((a, b) => a + b, 0);
    const isWithinTolerance = Math.abs(sum - target) / target <= DIMENSION_CHAIN_SUM_TOLERANCE;
    if (isWithinTolerance) return subset;
  }
  return null;
}

/** 주거 도면의 치수로 볼 수 있는 값인지. 제목·면적·호수에서 온 숫자를 걸러낸다 */
export const isPlausibleDimension = (value: number): boolean =>
  Number.isFinite(value) && DIMENSION_MIN_MM <= value && value <= DIMENSION_MAX_MM;

/**
 * 한 축에서 OCR된 치수 숫자들과 외곽 픽셀 길이로 mm/px를 추정한다.
 * LH 도면은 전체 치수 + 분할 치수를 함께 인쇄하므로 "분할 합 = 전체"인 조합을 찾으면 신뢰도가 높다.
 * 전체 치수가 없이 분할 치수만 인쇄된 도면도 있어, 그때는 합을 전체로 본다.
 */
export function estimateScale(candidatesMm: number[], extentPx: number): ScaleEstimate | null {
  const values = candidatesMm.filter(isPlausibleDimension);
  if (values.length === 0 || extentPx <= 0) return null;

  const sorted = [...values].sort((a, b) => b - a);
  for (const total of sorted) {
    const others = sorted.filter((v) => v !== total);
    const chain = findSubsetSummingTo(others, total);
    if (chain) {
      return { mmPerPx: total / extentPx, totalMm: total, chainMm: chain, confidence: SCALE_CHAIN_CONFIDENCE };
    }
  }

  // 전체 치수가 없으면 분할 치수가 한 변을 나눠 가진 것으로 본다
  const partitionTotal = sorted.reduce((a, b) => a + b, 0);
  if (sorted.length >= 2 && isPlausibleDimension(partitionTotal)) {
    return {
      mmPerPx: partitionTotal / extentPx,
      totalMm: partitionTotal,
      chainMm: sorted,
      confidence: SCALE_CHAIN_PARTITION_CONFIDENCE
    };
  }

  const fallbackTotal = sorted[0];
  return { mmPerPx: fallbackTotal / extentPx, totalMm: fallbackTotal, chainMm: [fallbackTotal], confidence: SCALE_MAX_FALLBACK_CONFIDENCE };
}

/** 추정 스케일로 환산한 외곽 면적과 인쇄 전용면적의 상대 편차 */
export function areaDeviation(mmPerPx: number, outlineAreaPx: number, printedAreaM2: number): number {
  const areaM2 = (outlineAreaPx * mmPerPx * mmPerPx) / MM2_PER_M2;
  return Math.abs(areaM2 - printedAreaM2) / printedAreaM2;
}

/**
 * 인쇄된 전용면적으로 스케일을 역산한다. 치수 OCR이 실패했을 때의 자동 대안.
 * 외곽 픽셀 면적에는 벽·발코니가 섞여 있어 치수 체인보다 거칠지만, 수동 입력보다는 낫다.
 */
export function scaleFromArea(printedAreaM2: number | undefined, outlineAreaPx: number): ScaleEstimate | null {
  if (!printedAreaM2 || printedAreaM2 <= 0 || outlineAreaPx <= 0) return null;
  const mmPerPx = Math.sqrt((printedAreaM2 * MM2_PER_M2) / outlineAreaPx);
  if (!Number.isFinite(mmPerPx) || mmPerPx <= 0) return null;
  return { mmPerPx, totalMm: 0, chainMm: [], confidence: SCALE_AREA_CONFIDENCE };
}
