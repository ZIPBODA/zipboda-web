const SYLLABLE_BASE = 0xac00;
const SYLLABLE_LAST = 0xd7a3;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

/**
 * 한글 음절을 자모로 편다.
 * OCR은 작은 한글에서 받침을 자주 놓친다("현관" → "혀과"). 글자 단위로 비교하면 두 글자가
 * 모두 틀린 것으로 보이지만, 자모로 펴면 ㄴ 두 개 차이일 뿐이라 같은 낱말임을 알아볼 수 있다.
 */
export function decomposeHangul(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < SYLLABLE_BASE || code > SYLLABLE_LAST) {
      out += char;
      continue;
    }
    const index = code - SYLLABLE_BASE;
    const jong = index % JONG_COUNT;
    const jung = Math.floor(index / JONG_COUNT) % JUNG_COUNT;
    const cho = Math.floor(index / (JONG_COUNT * JUNG_COUNT));
    out += CHO[cho] + JUNG[jung] + JONG[jong];
  }
  return out;
}
