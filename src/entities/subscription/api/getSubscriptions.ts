import { MOCK_SUBSCRIPTIONS } from "./__mocks__/subscriptions.mock";
import { DEFAULT_SORT } from "../config/constants";
import type { Subscription, SubscriptionFilter, SubscriptionSort } from "../model/types";

const ratio = (competition: string) => parseFloat(competition);

const SORTERS: Record<SubscriptionSort, (a: Subscription, b: Subscription) => number> = {
  DEADLINE: (a, b) => a.dday - b.dday,
  COMPETITION: (a, b) => ratio(a.competition) - ratio(b.competition),
  HOUSEHOLDS: (a, b) => b.households - a.households
};

// TODO(API-010): fetch("/api/subscriptions")로 교체, mock 제거(A1)
export async function getSubscriptions(filter?: Partial<SubscriptionFilter>): Promise<Subscription[]> {
  const region = filter?.region ?? "전체";
  const size = filter?.size ?? "전체";
  const agency = filter?.agency ?? "전체";
  const sort = filter?.sort ?? DEFAULT_SORT;

  let list = [...MOCK_SUBSCRIPTIONS];
  if (region !== "전체") list = list.filter((s) => s.region === region);
  if (agency !== "전체") list = list.filter((s) => s.agency === agency);
  if (size !== "전체") list = list.filter((s) => s.sizes.includes(Number(size)));

  return list.sort(SORTERS[sort] ?? SORTERS[DEFAULT_SORT]);
}
