export type AgencyCode = "LH" | "SH" | "GH" | "IH";

export type SubscriptionSort = "DEADLINE" | "COMPETITION" | "HOUSEHOLDS";

// ITF-002 청약 공고 상태
export type SubscriptionStatus = "접수예정" | "접수중" | "마감" | "취소";

export interface Subscription {
  id: string;
  agency: AgencyCode;
  title: string;
  region: string;
  location: string;
  sizes: number[];
  applicants: number;
  households: number;
  competition: string;
  moveIn: string;
  deadline: string;
  dday: number;
  image: string;
}

export interface SubscriptionFilter {
  region: string;
  size: string;
  agency: string;
  sort: SubscriptionSort;
}

export interface SubscriptionUnit {
  size: number;
  type: string;
}

export interface SubscriptionDetail {
  id: string;
  agency: AgencyCode;
  agencyLabel: string;
  status: SubscriptionStatus;
  title: string;
  address: string;
  dday: number;
  applyPeriod: string;
  households: string;
  supplyType: string;
  competition: string;
  contractDate: string;
  moveIn: string;
  postDate: string;
  units: SubscriptionUnit[];
  /** 상세 진입 시 기본 선택 평형 */
  defaultUnitSize: number;
  /** 공급기관 신청 페이지. 집보다는 신청을 대행하지 않고 이 주소로 이동시킨다(REQ-US-001) */
  applyUrl: string;
}
