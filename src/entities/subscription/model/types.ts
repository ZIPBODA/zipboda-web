export type AgencyCode = "LH" | "SH" | "GH" | "IH";
export type SubscriptionSort = "DEADLINE" | "COMPETITION" | "HOUSEHOLDS";

/** 청약 공고(목록 카드) UI 모델 — figma 135:5598 / API-010 소비 계약 */
export interface Subscription {
  id: string;
  title: string;
  agency: AgencyCode;
  region: string; // 서울/인천/경기 (필터 매칭)
  location: string; // "서울 · 광진구"
  sizes: number[]; // 공급 평형(㎡)
  applicants: number; // 신청자(공공데이터 집계)
  households: number; // 총 세대수
  competition: string; // 경쟁률 "12.4:1"
  moveIn: string; // 입주 예정
  dday: number; // 마감 D-n
}

export interface SubscriptionFilter {
  region?: string;
  agency?: string;
  size?: string;
  sort?: SubscriptionSort;
}
