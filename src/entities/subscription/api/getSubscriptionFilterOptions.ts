import { getApi } from "@/shared/api/client";
import type { SubscriptionFilterOptions } from "../model/types";
import type { SubscriptionFilterOptionsDto } from "./subscription.dto";
import { toFilterOptions } from "./subscriptionMapper";

/**
 * 필터 칩은 데이터에 실제로 있는 값으로만 만든다. 눌러도 언제나 0건인 칩은 필터가 아니라 고장이다.
 * 지금 걸린 필터와 상관없이 센다 — 걸린 필터로 세면 칩이 눌릴 때마다 사라져 되돌아갈 수 없다
 */
export async function getSubscriptionFilterOptions(): Promise<SubscriptionFilterOptions> {
  return toFilterOptions(await getApi<SubscriptionFilterOptionsDto>("/subscriptions/filter-options"));
}
