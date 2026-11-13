import { API_STATUS, ApiError, getApi } from "@/shared/api/client";
import type { SubscriptionDetail } from "../model/types";
import type { SubscriptionDetailDto } from "./subscription.dto";
import { toSubscriptionDetail } from "./subscriptionMapper";

/** 없는 공고와 형식이 틀린 주소(지나치게 긴 id 등)는 모두 '없음'이다 — 화면은 404로 보인다 */
const MISSING_STATUSES: readonly number[] = [API_STATUS.NOT_FOUND, API_STATUS.VALIDATION];

export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetail | null> {
  try {
    return toSubscriptionDetail(await getApi<SubscriptionDetailDto>(`/subscriptions/${encodeURIComponent(id)}`));
  } catch (error) {
    if (error instanceof ApiError && MISSING_STATUSES.includes(error.status)) return null;
    throw error;
  }
}
