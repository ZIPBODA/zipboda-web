/** 같은 이름이 여러 번 온 주소 값(?q=a&q=b)은 첫 값을 쓴다 — 배열을 글자로 다루다 오류가 나지 않게 */
export const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;
