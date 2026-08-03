import type { AgencyCode, SubscriptionSort, SubscriptionStatus } from "../model/types";

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

// figma 135:5143 공급기관 태그(상세) — 목록 카드의 solid 배지와 달리 연한 배경 + 기관색 텍스트
export const AGENCY_TAG_TONE: Record<AgencyCode, string> = {
  LH: "bg-status-info-bg text-blue-600",
  SH: "bg-status-success-bg text-status-success-text",
  GH: "bg-status-warning-bg text-brand-dark",
  IH: "bg-surface-tertiary text-gray-700"
};

/**
 * figma 150:39 상태 배지. Figma가 정의한 상태는 '접수중' 하나뿐이라 나머지는
 * 디자인시스템 §5.1 '저장됨'의 중립 스타일로 폴백한다(임의 색 생성 금지).
 * 배경 #EDF7ED는 토큰 미등록 — 디자인시스템 등록 후 토큰으로 교체 대상.
 */
export const STATUS_BADGE_TONE: Record<SubscriptionStatus, string> = {
  접수중: "bg-[#EDF7ED] text-fg-heading",
  접수예정: "bg-surface-tertiary text-fg-muted",
  마감: "bg-surface-tertiary text-fg-muted",
  취소: "bg-surface-tertiary text-fg-muted"
};
