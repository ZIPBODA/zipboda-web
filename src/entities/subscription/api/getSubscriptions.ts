import { SUBSCRIPTIONS } from "./housingCatalog";
import { DEFAULT_SORT, FILTER_ALL } from "../config/constants";
import { matchesSizeRange } from "../lib/matchesSizeRange";
import type { Subscription, SubscriptionFilter, SubscriptionSort } from "../model/types";

const ratio = (competition: string | null) => competition === null ? Number.POSITIVE_INFINITY : parseFloat(competition);

const SORTERS: Record<SubscriptionSort, (a: Subscription, b: Subscription) => number> = {
  DEADLINE: (a, b) => (a.dday ?? Number.POSITIVE_INFINITY) - (b.dday ?? Number.POSITIVE_INFINITY),
  COMPETITION: (a, b) => ratio(a.competition) - ratio(b.competition),
  HOUSEHOLDS: (a, b) => (b.households ?? -1) - (a.households ?? -1)
};

export async function getSubscriptions(filter?: Partial<SubscriptionFilter>): Promise<Subscription[]> {
  const region = filter?.region ?? FILTER_ALL;
  const size = filter?.size ?? FILTER_ALL;
  const agency = filter?.agency ?? FILTER_ALL;
  const sort = filter?.sort ?? DEFAULT_SORT;

  let list = [...SUBSCRIPTIONS];
  if (region !== FILTER_ALL) list = list.filter((s) => s.region === region);
  if (agency !== FILTER_ALL) list = list.filter((s) => s.agency === agency);
  if (size !== FILTER_ALL) list = list.filter((s) => matchesSizeRange(s.sizes, size));

  return list.sort(SORTERS[sort] ?? SORTERS[DEFAULT_SORT]);
}
