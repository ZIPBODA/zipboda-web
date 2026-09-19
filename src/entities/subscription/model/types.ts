import type { GeoPoint } from "@/shared/lib/geo";

export type AgencyCode = "LH" | "SH" | "GH" | "IH";

export type SubscriptionSort = "DEADLINE" | "COMPETITION" | "HOUSEHOLDS";

// ITF-002 청약 공고 상태
export type SubscriptionStatus = "접수예정" | "접수중" | "마감" | "취소";

export interface Subscription {
  id: string;
  agency: AgencyCode | null;
  title: string;
  region: string;
  location: string;
  /** 주소를 좌표로 바꾼 결과. 지오코딩 전이거나 실패하면 없다 */
  coord?: GeoPoint | null;
  sizes: number[];
  applicants: number | null;
  households: number | null;
  competition: string | null;
  moveIn: string | null;
  deadline: string | null;
  dday: number | null;
  image: string | null;
}

export interface SubscriptionFilter {
  region: string;
  size: string;
  agency: string;
  sort: SubscriptionSort;
}

export interface SubscriptionUnit {
  unitKey?: string;
  layoutKey?: string;
  label?: string;
  floor?: string;
  unit?: string;
  size: number | null;
  type: string;
}

export interface SubscriptionDetail {
  defaultUnitKey?: string;
  sourcePdf?: string;
  sourceIssues?: string[];
  id: string;
  agency: AgencyCode | null;
  agencyLabel: string;
  status: SubscriptionStatus | null;
  title: string;
  address: string;
  /** 주소를 좌표로 바꾼 결과. 지오코딩 전이거나 실패하면 없다 */
  coord?: GeoPoint | null;
  dday: number | null;
  applyPeriod: string | null;
  households: string | null;
  /** 이번 공고로 공급하는 호수. 건물 전체 세대수(households)와 다르다 */
  supplyUnits?: number | null;
  /** 예비입주자를 포함한 모집 인원 */
  recruitCount?: number | null;
  supplyType: string | null;
  competition: string | null;
  contractDate: string | null;
  moveIn: string | null;
  postDate: string | null;
  units: SubscriptionUnit[];
  /** 상세 진입 시 기본 선택 평형 */
  defaultUnitSize: number | null;
  /** 상세 히어로 배너 이미지 */
  image: string | null;
  /** 공급기관 신청 페이지. 집보다는 신청을 대행하지 않고 이 주소로 이동시킨다(REQ-US-001) */
  applyUrl: string | null;
}
