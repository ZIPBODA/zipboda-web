import { TOKEN_LINE_TOLERANCE_RATIO, TOKEN_MERGE_GAP_RATIO } from "../config/constants";
import type { OcrTextToken } from "../model/types";

/**
 * 글자 단위로 쪼개진 OCR 토큰을 한 단어로 다시 묶는다.
 * Tesseract는 작은 한글을 글자마다 따로 내놓는다("주방/식당" → 주·방·/·식·당).
 * 그대로 두면 "방" 한 글자가 침실로 잡히는 식의 오탐이 생긴다.
 * 같은 줄에서 가로로 바짝 붙은 토큰을 이어 붙여 단어를 복원한다.
 */
export function mergeTextTokens(
  tokens: OcrTextToken[],
  lineToleranceRatio = TOKEN_LINE_TOLERANCE_RATIO,
  gapRatio = TOKEN_MERGE_GAP_RATIO
): OcrTextToken[] {
  const ordered = [...tokens].sort((a, b) => a.center.y - b.center.y || a.center.x - b.center.x);
  const merged: OcrTextToken[] = [];

  for (const token of ordered) {
    const last = merged[merged.length - 1];
    if (last === undefined) {
      merged.push({ ...token });
      continue;
    }
    const reference = Math.max(last.height, token.height);
    const sameLine = Math.abs(token.center.y - last.center.y) <= reference * lineToleranceRatio;
    const gap = token.center.x - token.width / 2 - (last.center.x + last.width / 2);
    const adjacent = gap <= reference * gapRatio;

    if (!sameLine || !adjacent) {
      merged.push({ ...token });
      continue;
    }
    const left = last.center.x - last.width / 2;
    const right = token.center.x + token.width / 2;
    merged[merged.length - 1] = {
      text: last.text + token.text,
      center: { x: (left + right) / 2, y: (last.center.y + token.center.y) / 2 },
      width: right - left,
      height: Math.max(last.height, token.height)
    };
  }
  return merged;
}
