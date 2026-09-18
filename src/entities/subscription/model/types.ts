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
  dday: number | null;
  applyPeriod: string | null;
  households: string | null;
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
