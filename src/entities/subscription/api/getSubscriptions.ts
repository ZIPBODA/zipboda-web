import type { Subscription, SubscriptionFilter } from "../model/types";
import { MOCK_SUBSCRIPTIONS } from "./__mocks__/subscriptions.mock";

// TODO(API-010): fetch("/api/subscriptions", {region,agency,size,sort}) 로 교체(frontend-rule A1). 현재는 격리 mock 소비.
export async function getSubscriptions(filter: SubscriptionFilter = {}): Promise<Subscription[]> {
  let list = [...MOCK_SUBSCRIPTIONS];

  const isAll = (v?: string) => !v || v === "전체";
  if (!isAll(filter.region)) list = list.filter((s) => s.region === filter.region);
  if (!isAll(filter.agency)) list = list.filter((s) => s.agency === filter.agency);
  if (!isAll(filter.size)) list = list.filter((s) => s.sizes.includes(Number(filter.size)));

  switch (filter.sort) {
    case "COMPETITION":
      list.sort((a, b) => parseFloat(a.competition) - parseFloat(b.competition));
      break;
    case "HOUSEHOLDS":
      list.sort((a, b) => b.households - a.households);
      break;
    default:
      list.sort((a, b) => a.dday - b.dday); // 마감 임박순
  }
  return list;
}
