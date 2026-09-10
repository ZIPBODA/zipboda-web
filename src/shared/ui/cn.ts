/** 조건부 className 병합(의존성 없이). falsy 제거 후 공백 조인 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
