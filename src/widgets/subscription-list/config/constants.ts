// figma PC 413:1080 / Mobile 419:9832 청약 목록의 지도 보기 — 별도 화면이 아니라 목록 화면의 한 상태다
export const SUBSCRIPTION_LIST_VIEWS = [
  { key: "list", label: "목록" },
  { key: "map", label: "지도" }
] as const;

export type SubscriptionListView = (typeof SUBSCRIPTION_LIST_VIEWS)[number]["key"];

export const SUBSCRIPTION_LIST_VIEW_KEYS: readonly string[] = SUBSCRIPTION_LIST_VIEWS.map((view) => view.key);

export const DEFAULT_SUBSCRIPTION_LIST_VIEW: SubscriptionListView = "list";

/** 지도 높이 — 목록과 나란히 두는 PC, 카드가 아래 붙는 모바일 */
export const MAP_VIEW_HEIGHT = { mobile: "h-[420px]", desktop: "md:h-[560px]" } as const;
