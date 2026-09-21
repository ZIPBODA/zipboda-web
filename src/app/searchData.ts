import { cache } from "react";
import { getProductDetail, getShopProducts } from "@/entities/product";
import { getSubscriptionDetail, getSubscriptions } from "@/entities/subscription";
import { createSearchIndex } from "@/features/search";

/**
 * 전체 모델은 서버에 두고 Header에는 검색·추천 표시에 필요한 필드만 보낸다.
 * cache()는 서버 컴포넌트 환경에만 있으므로 클라이언트가 닿는 배럴에 올리지 않고 앱 레이어에 둔다.
 */
export const getSearchData = cache(async () => {
  const [subscriptions, products] = await Promise.all([getSubscriptions(), getShopProducts()]);
  const [subscriptionDetails, productDetails] = await Promise.all([
    Promise.all(subscriptions.map((item) => getSubscriptionDetail(item.id))),
    Promise.all(products.map((item) => getProductDetail(item.id)))
  ]);
  return { subscriptions, products, index: createSearchIndex(subscriptions, products, subscriptionDetails, productDetails) };
});
