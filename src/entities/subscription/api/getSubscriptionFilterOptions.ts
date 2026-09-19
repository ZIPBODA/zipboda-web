import { SUBSCRIPTIONS } from "./housingCatalog";
import { FILTER_ALL, SIZE_RANGE_OPTIONS } from "../config/constants";
import { matchesSizeRange } from "../lib/matchesSizeRange";
import type { SubscriptionFilterOptions } from "../model/types";

const withAll = (values: string[]) => [FILTER_ALL, ...values];

/**
 * 필터 칩을 데이터에서 만든다. 눌러도 언제나 0건인 칩은 필터가 아니라 고장이다.
 * 전체 목록으로 계산한다 — 지금 걸린 필터로 세면 칩이 눌릴 때마다 사라져 되돌아갈 수 없다.
 */
export async function getSubscriptionFilterOptions(): Promise<SubscriptionFilterOptions> {
  const regions = [...new Set(SUBSCRIPTIONS.map((item) => item.region))].sort();
  const agencies = [...new Set(SUBSCRIPTIONS.flatMap((item) => item.agency === null ? [] : [item.agency]))].sort();
  const sizeRanges = SIZE_RANGE_OPTIONS.filter((range) =>
    SUBSCRIPTIONS.some((item) => matchesSizeRange(item.sizes, range.value))
  );

  return {
    regions: withAll(regions),
    agencies: withAll(agencies),
    sizeRanges: [{ value: FILTER_ALL, label: FILTER_ALL }, ...sizeRanges.map(({ value, label }) => ({ value, label }))]
  };
}
