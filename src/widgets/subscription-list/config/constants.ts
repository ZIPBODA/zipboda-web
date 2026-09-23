import { ZbSpace14, ZbSpace16, ZbSpace8 } from "@/shared/config/tokens";

// figma PC 413:1080 / Mobile 419:9832 목록·지도 전환
export const SUBSCRIPTION_LIST_VIEWS = [
  { key: "list", label: "목록" },
  { key: "map", label: "지도" }
] as const;

export type SubscriptionListView = (typeof SUBSCRIPTION_LIST_VIEWS)[number]["key"];

export const SUBSCRIPTION_LIST_VIEW_KEYS: readonly string[] = SUBSCRIPTION_LIST_VIEWS.map((view) => view.key);

export const DEFAULT_SUBSCRIPTION_LIST_VIEW: SubscriptionListView = "list";

export const MAP_INITIAL_CENTER = { lat: 37.5665, lng: 126.978 };
export const MAP_FIT_PADDING = [parseInt(ZbSpace14) * 3, parseInt(ZbSpace16), parseInt(ZbSpace16) + parseInt(ZbSpace8), parseInt(ZbSpace14)] as const;
export const MAP_FILTER_KEYS = ["region", "size", "agency", "status", "q"] as const;
