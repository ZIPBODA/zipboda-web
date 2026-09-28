import type { SubscriptionDetail } from "@/entities/subscription";

export interface MapDetailData {
  detail: SubscriptionDetail;
  plans: { unit: string; image: string; has3d: boolean }[];
}

export type LoadMapDetail = (id: string) => Promise<MapDetailData | null>;
