import {
  LABEL_ALIASES,
  LABEL_EXACT_CONFIDENCE,
  LABEL_JAMO_CONFIDENCE,
  LABEL_JAMO_MAX_DISTANCE,
  LABEL_MIN_ALIAS_LENGTH_FOR_TYPO,
  LABEL_PARTIAL_CONFIDENCE,
  LABEL_PRIORITY,
  LABEL_TRANSPOSE_CONFIDENCE,
  LABEL_TYPO_CONFIDENCE,
  LABEL_TYPO_MAX_DISTANCE,
  LABEL_UNKNOWN_CONFIDENCE
} from "../config/constants";
import type { LabelMatch } from "../model/types";
import { decomposeHangul } from "./hangul";

const normalizeText = (s: string) => s.replace(/[\s/·.,()\-_]/g, "").toLowerCase();

/**
 * 편집 거리. 인접한 두 글자가 뒤바뀐 것도 1로 센다(최적 문자열 정렬 거리).
 * OCR이 글자를 낱개로 내놓으면 상자 중심 순으로 다시 묶는데, 그때 "반침"이 "침반"으로 뒤집히기도 한다.
 */
export function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      const isTransposition = i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1];
      if (isTransposition) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const pickHigher = (a: LabelMatch, b: LabelMatch) => (b.confidence > a.confidence ? b : a);
const sortedChars = (s: string) => [...s].sort().join("");

/** OCR 텍스트를 방 라벨로 매핑한다. 우선순위 순으로 완전일치 > 부분일치 > 1글자 오탈자 */
export function mapRoomLabel(ocrText: string): LabelMatch {
  const text = normalizeText(ocrText);
  const unknown: LabelMatch = { label: "기타", confidence: LABEL_UNKNOWN_CONFIDENCE };
  if (!text) return unknown;

  let best = unknown;
  // 한 글자짜리 입력은 정보가 너무 적다("방"이 주방·안방, "침"이 침실·반침 어디로든 붙는다) — 부분·퍼지 매칭에서 제외한다
  const isLongEnough = text.length >= LABEL_MIN_ALIAS_LENGTH_FOR_TYPO;
  // 오탈자·자모 매칭은 한글 오인식을 흡수하려는 것이다. 라틴 잡음("Se")이 영문 별칭("bed")에 붙으면 욕실이 침실이 된다
  const hasHangul = /[가-힣]/.test(text);
  for (const label of LABEL_PRIORITY) {
    for (const alias of LABEL_ALIASES[label]) {
      const candidate = normalizeText(alias);
      if (text === candidate) return { label, confidence: LABEL_EXACT_CONFIDENCE };
      if (isLongEnough && text.includes(candidate)) {
        best = pickHigher(best, { label, confidence: LABEL_PARTIAL_CONFIDENCE });
        continue;
      }
      const isTypoEligible = isLongEnough && hasHangul && candidate.length >= LABEL_MIN_ALIAS_LENGTH_FOR_TYPO;
      if (isTypoEligible && levenshtein(text, candidate) <= LABEL_TYPO_MAX_DISTANCE) {
        const isTransposition = sortedChars(text) === sortedChars(candidate);
        best = pickHigher(best, { label, confidence: isTransposition ? LABEL_TRANSPOSE_CONFIDENCE : LABEL_TYPO_CONFIDENCE });
        continue;
      }
      // 받침이 빠진 한글 오인식은 글자 단위로는 전부 틀려 보인다 — 자모로 펴서 다시 본다
      if (isTypoEligible && levenshtein(decomposeHangul(text), decomposeHangul(candidate)) <= LABEL_JAMO_MAX_DISTANCE) {
        best = pickHigher(best, { label, confidence: LABEL_JAMO_CONFIDENCE });
      }
    }
  }
  return best;
}
