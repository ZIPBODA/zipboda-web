import type { AgencyCode, SubscriptionSort } from "../model/types";

export const REGION_OPTIONS = ["전체", "서울", "인천", "경기"] as const;
export const SIZE_OPTIONS = ["전체", "39", "59", "84", "114"] as const;
export const AGENCY_OPTIONS = ["전체", "LH", "SH", "GH", "IH"] as const;

export const SORT_OPTIONS: { value: SubscriptionSort; label: string }[] = [
  { value: "DEADLINE", label: "마감 임박" },
  { value: "COMPETITION", label: "경쟁률 낮은 순" },
  { value: "HOUSEHOLDS", label: "세대 수" }
];

export const DEFAULT_SORT: SubscriptionSort = "DEADLINE";

// figma 135:5706 D-day 배지 — D-7 이하 brand, 초과 gray
export const DDAY_URGENT_THRESHOLD = 7;

// figma 135:5673 공급기관 배지 배경. LH/SH는 Figma 확정색, GH/IH는 Figma 미노출(디자인시스템 확장)
export const AGENCY_BADGE_BG: Record<AgencyCode, string> = {
  LH: "bg-status-info",
  SH: "bg-status-success",
  GH: "bg-status-warning",
  IH: "bg-gray-700"
};
