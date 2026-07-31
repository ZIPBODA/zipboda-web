import type { AgencyCode, SubscriptionSort } from "../model/types";

export const REGION_OPTIONS = ["전체", "서울", "인천", "경기"] as const;
export const AGENCY_OPTIONS = ["전체", "LH", "SH", "GH", "IH"] as const;
export const SIZE_OPTIONS = ["전체", "39", "59", "84", "114"] as const;

export const SORT_OPTIONS: { value: SubscriptionSort; label: string }[] = [
  { value: "DEADLINE", label: "마감 임박" },
  { value: "COMPETITION", label: "경쟁률 낮은 순" },
  { value: "HOUSEHOLDS", label: "세대 수" }
];

export const DEFAULT_SORT: SubscriptionSort = "DEADLINE";

/** 마감 임박(D-day 강조) 임계 — figma: D-3 강조/D-10 중립 */
export const DDAY_URGENT_THRESHOLD = 7;

/**
 * 공급기관 배지 색 — figma 135:5598 ProviderBadge (LH #2B7FFF · SH #00BC7D).
 * GH·IH는 디자인 미정의(D6) → 잠정 매핑, 확정 시 갱신.
 */
export const AGENCY_BADGE_CLASS: Record<AgencyCode, string> = {
  LH: "bg-status-info text-fg-ondark",
  SH: "bg-status-success text-fg-ondark",
  GH: "bg-status-warning text-fg-ondark",
  IH: "bg-purple text-fg-ondark"
};
