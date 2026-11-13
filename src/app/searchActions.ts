"use server";

import { searchSubscriptions, type SubscriptionPage } from "@/entities/subscription";

/** 검색 결과 화면의 공공주택 '더 보기'. 서버 액션은 누구나 부를 수 있어 검색어는 글자만, 페이지는 1 이상의 정수만 받는다 */
export async function loadSearchHousingPage(query: string, page: number): Promise<SubscriptionPage> {
  return searchSubscriptions(typeof query === "string" ? query : "", { page: Number.isSafeInteger(page) && page >= 1 ? page : 1 });
}
