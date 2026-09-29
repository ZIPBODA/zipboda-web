import { ZbSpace14 } from "@/shared/config/tokens";

// figma PC 413:1080 / Mobile 419:9832 목록·지도 전환. 청약의 첫 화면은 지도라 지도를 앞에 둔다
export const SUBSCRIPTION_LIST_VIEWS = [
  { key: "map", label: "지도" },
  { key: "list", label: "목록" }
] as const;

export type SubscriptionListView = (typeof SUBSCRIPTION_LIST_VIEWS)[number]["key"];

export const SUBSCRIPTION_LIST_VIEW_KEYS: readonly string[] = SUBSCRIPTION_LIST_VIEWS.map((view) => view.key);

export const DEFAULT_SUBSCRIPTION_LIST_VIEW: SubscriptionListView = "map";

export const MAP_INITIAL_CENTER = { lat: 37.5665, lng: 126.978 };
/** 공고 전체에 맞출 때 패널·툴바에 가려진 폭 바깥으로 더 띄우는 여백. 가장자리 배지가 반쯤 잘리지 않을 만큼(배지 한 개 폭) */
export const MAP_FIT_MARGIN = parseInt(ZbSpace14);
export const MAP_FILTER_KEYS = ["region", "size", "agency", "status", "q"] as const;
export const MAP_GEOLOCATION_OPTIONS = { timeout: 10000, maximumAge: 60000 } as const;
/** 지도 위 요소가 이 높이를 CSS 변수로 받아 아래에 쌓인다(globals.css의 map-workspace-* 규칙과 짝) */
export const MAP_OVERLAY_HEIGHT_VARS = [
  { selector: ".map-workspace-toolbar", name: "--map-toolbar-height" }
] as const;

/** 지도 중심·확대 단계를 담는 쿼리. 뒤로가기·새로고침·공유 링크에서 보던 지도를 그대로 연다 */
export const MAP_VIEWPORT_QUERY_KEYS = { lat: "lat", lng: "lng", zoom: "zoom" } as const;
/** 소수 다섯째 자리는 약 1m다. 더 적으면 돌아왔을 때 화면이 눈에 띄게 밀린다 */
export const MAP_VIEWPORT_PRECISION = 5;

/** 모바일 목록 시트의 높이 단계 — 손잡이만(peek), 화면 절반(half), 툴바 아래까지(full) */
export const MAP_SHEET_SNAPS = ["peek", "half", "full"] as const;
/** 손가락이 이만큼 움직이기 전까지는 끌기가 아니라 누름으로 본다 */
export const MAP_SHEET_TAP_SLOP_PX = 8;
/** 작업 공간 높이의 이 비율보다 길게 끌면 한 단계를 건너뛴다 */
export const MAP_SHEET_LONG_DRAG_RATIO = 1 / 3;

/** 지도 위를 덮는 요소들. 흐름 안에 선 것(PC 왼쪽 열)은 왼쪽을, 떠 있는 것은 위·아래를 가린다 */
export const MAP_OVERLAY_SELECTORS = {
  canvas: ".map-workspace-canvas",
  toolbar: ".map-workspace-toolbar",
  rail: ".map-workspace-rail",
  zoom: '[aria-label="지도 배율"]',
  panels: 'aside[aria-label="청약 목록"], aside[aria-label="선택한 청약 상세"]',
  bottomBar: ".map-workspace-status, .map-workspace-count"
} as const;
