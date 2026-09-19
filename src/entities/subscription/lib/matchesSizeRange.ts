import { FILTER_ALL, SIZE_RANGE_OPTIONS } from "../config/constants";

const RANGE_BY_VALUE = new Map(SIZE_RANGE_OPTIONS.map((range) => [range.value, range]));

/**
 * 공고가 그 면적 구간의 평형을 하나라도 가지고 있는지.
 * 경계는 왼쪽만 포함한다(min ≤ 면적 < max) — 20㎡가 두 구간에 겹쳐 잡히지 않게.
 * 모르는 구간 값은 조건을 걸지 않는다. 예전 링크(?size=39)가 빈 목록이 되지 않게 한다.
 */
export function matchesSizeRange(sizes: number[], rangeValue: string): boolean {
  if (rangeValue === FILTER_ALL) return true;
  const range = RANGE_BY_VALUE.get(rangeValue);
  if (!range) return true;
  return sizes.some((size) => range.min <= size && (range.max === null || size < range.max));
}
