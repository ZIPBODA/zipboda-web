import { getApi } from "@/shared/api/client";
import { LIST_PAGE_SIZE } from "../config/constants";
import type { SubscriptionFilter, SubscriptionPage, SubscriptionPageRequest } from "../model/types";
import type { SubscriptionListDto } from "./subscription.dto";
import { sortOf, toFilterQuery, toSubscriptionPage } from "./subscriptionMapper";

export async function getSubscriptions(
  filter: Partial<SubscriptionFilter> = {},
  { page = 1, pageSize = LIST_PAGE_SIZE }: SubscriptionPageRequest = {}
): Promise<SubscriptionPage> {
  const dto = await getApi<SubscriptionListDto>("/subscriptions", { ...toFilterQuery(filter), sort: sortOf(filter.sort), page, pageSize });
  return toSubscriptionPage(dto);
}
