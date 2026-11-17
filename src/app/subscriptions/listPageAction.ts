"use server";

import { getSubscriptions, type SubscriptionFilter, type SubscriptionPage } from "@/entities/subscription";

/** 서버 액션은 누구나 부를 수 있는 입구다. 페이지 번호는 1 이상의 정수만 받고, 필터는 API 조건으로 바꿀 때 모르는 값을 버린다 */
export async function loadSubscriptionPage(filter: Partial<SubscriptionFilter>, page: number): Promise<SubscriptionPage> {
  return getSubscriptions(filter, { page: Number.isSafeInteger(page) && page >= 1 ? page : 1 });
}
