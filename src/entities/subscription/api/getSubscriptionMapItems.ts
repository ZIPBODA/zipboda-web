import { getApi } from "@/shared/api/client";
import type { SubscriptionFilter, SubscriptionMapItems } from "../model/types";
import type { SubscriptionMapDto } from "./subscription.dto";
import { sortOf, toFilterQuery, toSubscription } from "./subscriptionMapper";

/** 지도는 영역을 나눠 받지 않고 조건에 맞는 핀을 한 번에 받는다 — 화면이 핀을 묶고, 보이는 범위의 공고를 옆 목록에 그린다 */
export async function getSubscriptionMapItems(filter: Partial<SubscriptionFilter> = {}): Promise<SubscriptionMapItems> {
  const dto = await getApi<SubscriptionMapDto>("/subscriptions/map", { ...toFilterQuery(filter), sort: sortOf(filter.sort) });
  return { items: dto.markers.map(toSubscription), totalCount: dto.totalCount };
}
