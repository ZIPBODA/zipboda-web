import type { GeoPoint } from "@/shared/lib/geo";

export type AgencyCode = "LH" | "SH" | "GH" | "IH";

export type SubscriptionSort = "DEADLINE" | "COMPETITION" | "HOUSEHOLDS";

// ITF-002 청약 공고 상태
export type SubscriptionStatus = "접수예정" | "접수중" | "마감" | "취소";

export interface Subscription {
  status?: SubscriptionStatus | null;
  supplyType?: string | null;
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

/** 지금 데이터로 고를 수 있는 필터 칩. 서버에서 만들어 목록 화면에 내려준다 */
export interface SubscriptionFilterOptions {
  statuses?: SubscriptionStatus[];
  regions: string[];
  agencies: string[];
  sizeRanges: { value: string; label: string }[];
}

/** 목록 한 페이지. 화면이 '공고 N건'과 '더 보기'를 그리도록 전체 건수를 함께 둔다 */
export interface SubscriptionPage {
  items: Subscription[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface SubscriptionPageRequest {
  page?: number;
  pageSize?: number;
}

/** 지도에 올릴 공고(좌표가 있는 것)와, 좌표가 없는 공고까지 센 전체 건수 */
export interface SubscriptionMapItems {
  items: Subscription[];
  totalCount: number;
}

export interface SubscriptionFilter {
  q: string;
  status: string;
  region: string;
  size: string;
  agency: string;
  sort: SubscriptionSort;
}

export interface SubscriptionUnit {
  unitKey?: string;
  /** 평면도가 있는 호만 있다. 도면 자산(entities/floorplan)을 찾는 열쇠다 */
  layoutKey?: string;
  label?: string;
  floor?: string;
  unit?: string;
  size: number | null;
  type: string;
  image2dUrl?: string | null;
  has3d?: boolean;
}

export interface SubscriptionDetail {
  defaultUnitKey?: string;
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
