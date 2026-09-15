import {
  LABEL_ALIASES,
  LABEL_EXACT_CONFIDENCE,
  LABEL_MIN_ALIAS_LENGTH_FOR_TYPO,
  LABEL_PARTIAL_CONFIDENCE,
  LABEL_PRIORITY,
  LABEL_TYPO_CONFIDENCE,
  LABEL_TYPO_MAX_DISTANCE,
  LABEL_UNKNOWN_CONFIDENCE
} from "../config/constants";
import type { LabelMatch } from "../model/types";

const normalizeText = (s: string) => s.replace(/[\s/·.,()\-_]/g, "").toLowerCase();

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + cost);
      diagonal = temp;
    }
  }
  return prev[b.length];
}

const pickHigher = (a: LabelMatch, b: LabelMatch) => (b.confidence > a.confidence ? b : a);

/** OCR 텍스트를 방 라벨로 매핑한다. 우선순위 순으로 완전일치 > 부분일치 > 1글자 오탈자 */
export function mapRoomLabel(ocrText: string): LabelMatch {
  const text = normalizeText(ocrText);
  const unknown: LabelMatch = { label: "기타", confidence: LABEL_UNKNOWN_CONFIDENCE };
  if (!text) return unknown;

  let best = unknown;
  for (const label of LABEL_PRIORITY) {
    for (const alias of LABEL_ALIASES[label]) {
      const candidate = normalizeText(alias);
      if (text === candidate) return { label, confidence: LABEL_EXACT_CONFIDENCE };
      if (text.includes(candidate)) {
        best = pickHigher(best, { label, confidence: LABEL_PARTIAL_CONFIDENCE });
        continue;
      }
      // 한 글자짜리 입력은 정보가 너무 적다("방"이 주방·안방 어디로든 붙는다) — 퍼지 매칭에서 제외한다
      const isTypoEligible =
        candidate.length >= LABEL_MIN_ALIAS_LENGTH_FOR_TYPO && text.length >= LABEL_MIN_ALIAS_LENGTH_FOR_TYPO;
      if (isTypoEligible && levenshtein(text, candidate) <= LABEL_TYPO_MAX_DISTANCE) {
        best = pickHigher(best, { label, confidence: LABEL_TYPO_CONFIDENCE });
      }
    }
  }
  return best;
}
