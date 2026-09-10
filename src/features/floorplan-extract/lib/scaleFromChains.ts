import {
  DIMENSION_CHAIN_SUM_TOLERANCE,
  DIMENSION_SUBSET_MAX,
  SCALE_CHAIN_CONFIDENCE,
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

/**
 * 한 축에서 OCR된 치수 숫자들과 외곽 픽셀 길이로 mm/px를 추정한다.
 * LH 도면은 전체 치수 + 분할 치수를 함께 인쇄하므로 "분할 합 = 전체"인 조합을 찾으면 신뢰도가 높다.
 */
export function estimateScale(candidatesMm: number[], extentPx: number): ScaleEstimate | null {
  const values = candidatesMm.filter((v) => Number.isFinite(v) && v > 0);
  if (values.length === 0 || extentPx <= 0) return null;

  const sorted = [...values].sort((a, b) => b - a);
  for (const total of sorted) {
    const others = sorted.filter((v) => v !== total);
    const chain = findSubsetSummingTo(others, total);
    if (chain) {
      return { mmPerPx: total / extentPx, totalMm: total, chainMm: chain, confidence: SCALE_CHAIN_CONFIDENCE };
    }
  }

  const fallbackTotal = sorted[0];
  return { mmPerPx: fallbackTotal / extentPx, totalMm: fallbackTotal, chainMm: [fallbackTotal], confidence: SCALE_MAX_FALLBACK_CONFIDENCE };
}

/** 추정 스케일로 환산한 외곽 면적과 인쇄 전용면적의 상대 편차 */
export function areaDeviation(mmPerPx: number, outlineAreaPx: number, printedAreaM2: number): number {
  const areaM2 = (outlineAreaPx * mmPerPx * mmPerPx) / MM2_PER_M2;
  return Math.abs(areaM2 - printedAreaM2) / printedAreaM2;
}
