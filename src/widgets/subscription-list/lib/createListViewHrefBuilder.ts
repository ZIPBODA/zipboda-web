import { DEFAULT_SUBSCRIPTION_LIST_VIEW, type SubscriptionListView } from "../config/constants";

/** 목록 화면이 이미 쿼리로 들고 있는 필터들 */
export type ListSearchParams = Record<string, string | undefined>;

/**
 * 보기 방식만 바꾸고 필터는 그대로 들고 간다.
 * 기본값은 쿼리에서 빼 URL을 짧게 유지한다 — 상세 화면 링크 규칙과 같다.
 */
export function createListViewHrefBuilder(searchParams: ListSearchParams) {
  return (view: SubscriptionListView): string => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "view" || value === undefined || value === "") continue;
      query.set(key, value);
    }
    if (view !== DEFAULT_SUBSCRIPTION_LIST_VIEW) query.set("view", view);

    const search = query.toString();
    return search ? `/subscriptions?${search}` : "/subscriptions";
  };
}
