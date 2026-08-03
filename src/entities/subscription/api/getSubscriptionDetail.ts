import { MOCK_SUBSCRIPTION_DETAIL } from "./__mocks__/subscriptionDetail.mock";
import type { SubscriptionDetail } from "../model/types";

// TODO(API-011): fetch(`/api/subscriptions/${id}`)로 교체, mock 제거(A1)
export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetail | null> {
  return id === MOCK_SUBSCRIPTION_DETAIL.id ? MOCK_SUBSCRIPTION_DETAIL : null;
}
