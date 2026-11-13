import type { AgencyCode, SubscriptionSort, SubscriptionStatus } from "../model/types";

/** 필터 칩의 첫 자리. 어떤 축이든 '전체'는 조건을 걸지 않는다는 뜻이다 */
export const FILTER_ALL = "전체";

/**
 * 면적은 값이 아니라 구간으로 고른다.
 * 매입임대 주택의 전용면적은 14.6475㎡처럼 소수점이 붙어 값 일치로는 맞출 수 없다.
 * 구간에 드는지는 API가 가린다(min ≤ 면적 < max). 여기는 API 구간 값에 붙일 이름표다
 */
export const SIZE_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "0-15", label: "~15㎡" },
  { value: "15-20", label: "15~20㎡" },
  { value: "20-25", label: "20~25㎡" },
  { value: "25-30", label: "25~30㎡" },
  { value: "30-", label: "30㎡~" }
];

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

/** 청약 첫 화면(지도). 목록은 같은 주소에 ?view=list를 붙인다 */
export const SUBSCRIPTIONS_PATH = "/subscriptions";

/** 공고 상세에서 '돌아가기'가 마지막으로 보던 지도·목록 주소로 가도록 탭 단위로 기억한다 */
export const SUBSCRIPTIONS_RETURN_STORAGE_KEY = "zipboda:subscriptions-return";

// 아래 세 코드표는 API 정의서 공통 인터페이스(ITF-001·002·004)다. 화면은 이름(LH·접수중·서울)으로, API는 코드로 주고받는다
export const AGENCY_API_CODES: readonly { name: AgencyCode; code: number }[] = [
  { name: "LH", code: 1 },
  { name: "SH", code: 2 },
  { name: "GH", code: 3 },
  { name: "IH", code: 4 }
];

export const STATUS_API_CODES: readonly { name: SubscriptionStatus; code: number }[] = [
  { name: "접수예정", code: 1 },
  { name: "접수중", code: 2 },
  { name: "마감", code: 3 },
  { name: "취소", code: 4 }
];

export const REGION_API_CODES: readonly { name: string; code: number }[] = [
  { name: "서울", code: 1 },
  { name: "인천", code: 2 },
  { name: "경기", code: 3 }
];

/** API가 받는 검색어 길이 상한. 넘기면 API가 요청 오류(422)를 준다 */
export const KEYWORD_MAX_LENGTH = 100;

/** 목록이 한 번에 받는 공고 수 — 첫 화면과 '더 보기' 한 번이 같은 양이다 */
export const LIST_PAGE_SIZE = 20;

/** 매입임대 현황도에서 도면을 따로 뽑은 호는 같은 호 번호 뒤에 붙여 구분했다. 화면의 호 번호에는 보이지 않는다 */
export const DRAWING_UNIT_SUFFIX = "-drawing";

/** 면적 화면 표기 자릿수. 원천은 소수 넷째 자리까지 오지만(청약홈 84.6192㎡) 화면에는 둘째 자리까지 보인다 — 필터·정렬은 원래 값을 쓴다 */
export const AREA_DISPLAY_DECIMALS = 2;

/** 카드 한 장에 보이는 면적 칩 수. 넘치면 '+n' 칩 하나로 줄인다 — 주택형이 열 개 넘는 단지가 옆 수치를 덮지 않게 */
export const SIZE_CHIP_LIMIT = 4;
