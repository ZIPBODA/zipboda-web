import { SUBSCRIPTION_DETAILS } from "./housingCatalog";
import type { SubscriptionDetail } from "../model/types";

export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetail | null> {
  return SUBSCRIPTION_DETAILS.find((detail) => detail.id === id) ?? null;
}
