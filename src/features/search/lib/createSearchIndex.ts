import type { Product, ProductDetail } from "@/entities/product";
import type { Subscription, SubscriptionDetail } from "@/entities/subscription";
import type { SearchEntry } from "../model/types";

export function createSearchIndex(
  subscriptions: readonly Subscription[],
  products: readonly Product[],
  subscriptionDetails: readonly (SubscriptionDetail | null)[],
  productDetails: readonly (ProductDetail | null)[]
): SearchEntry[] {
  return [
    ...subscriptions.map((item): SearchEntry => {
      const detail = subscriptionDetails.find((entry) => entry?.id === item.id);
      const address = detail?.address || item.location;
      const context = [item.agency, item.region].filter(Boolean).join(" · ");
      return {
        id: item.id, kind: "housing", name: item.title,
        href: `/subscriptions/${encodeURIComponent(item.id)}`,
        description: address, context,
        fields: [address, item.location, item.region, item.agency, detail?.agencyLabel, detail?.supplyType]
          .filter((field): field is string => Boolean(field))
      };
    }),
    ...products.map((item): SearchEntry => {
      const detail = productDetails.find((entry) => entry?.id === item.id);
      return {
        id: item.id, kind: "product", name: item.name,
        href: `/shop/${encodeURIComponent(item.id)}`,
        description: [item.brand, item.category].filter(Boolean).join(" · "), context: "", price: item.price,
        fields: [item.brand, item.category, detail?.description]
          .filter((field): field is string => Boolean(field))
      };
    })
  ];
}
