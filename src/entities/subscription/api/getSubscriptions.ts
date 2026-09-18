import { SUBSCRIPTIONS } from "./housingCatalog";
import { DEFAULT_SORT } from "../config/constants";
import type { Subscription, SubscriptionFilter, SubscriptionSort } from "../model/types";

const ratio = (competition: string | null) => competition === null ? Number.POSITIVE_INFINITY : parseFloat(competition);

const SORTERS: Record<SubscriptionSort, (a: Subscription, b: Subscription) => number> = {
  DEADLINE: (a, b) => (a.dday ?? Number.POSITIVE_INFINITY) - (b.dday ?? Number.POSITIVE_INFINITY),
  COMPETITION: (a, b) => ratio(a.competition) - ratio(b.competition),
  HOUSEHOLDS: (a, b) => (b.households ?? -1) - (a.households ?? -1)
};

export async function getSubscriptions(filter?: Partial<SubscriptionFilter>): Promise<Subscription[]> {
  const region = filter?.region ?? "전체";
  const size = filter?.size ?? "전체";
  const agency = filter?.agency ?? "전체";
  const sort = filter?.sort ?? DEFAULT_SORT;

  let list = [...SUBSCRIPTIONS];
  if (region !== "전체") list = list.filter((s) => s.region === region);
  if (agency !== "전체") list = list.filter((s) => s.agency === agency);
  if (size !== "전체") list = list.filter((s) => s.sizes.includes(Number(size)));

  return list.sort(SORTERS[sort] ?? SORTERS[DEFAULT_SORT]);
}
