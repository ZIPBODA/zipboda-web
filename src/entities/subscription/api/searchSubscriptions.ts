import { getApi } from "@/shared/api/client";
import { cleanQuery } from "@/shared/lib/searchQuery";
import { KEYWORD_MAX_LENGTH, LIST_PAGE_SIZE } from "../config/constants";
import type { SubscriptionPage, SubscriptionPageRequest } from "../model/types";
import type { SubscriptionSearchDto } from "./subscription.dto";
import { toSubscription } from "./subscriptionMapper";

/** 통합 검색의 공공주택 몫. 순위(제목 일치 → 앞부분 → 포함 → 다른 필드, 같으면 마감 임박순)는 API가 매긴다 */
export async function searchSubscriptions(
  query: string,
  { page = 1, pageSize = LIST_PAGE_SIZE }: SubscriptionPageRequest = {}
): Promise<SubscriptionPage> {
  const keyword = cleanQuery(query).slice(0, KEYWORD_MAX_LENGTH);
  if (!keyword) return { items: [], page, pageSize, totalCount: 0 };
  const dto = await getApi<SubscriptionSearchDto>("/search", { q: keyword, page, pageSize });
  return {
    items: dto.subscriptions.items.map(toSubscription),
    page: dto.page,
    pageSize: dto.pageSize,
    totalCount: dto.subscriptions.totalCount
  };
}
