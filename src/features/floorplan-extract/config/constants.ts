import type { RoomLabel } from "@/entities/floorplan";

// 벽 마스크 — LH/SH 도면의 벽은 굵은 검정 실선, 치수선·글자는 가는 선이라 임계+형태학으로 분리된다
export const WALL_DARK_THRESHOLD = 128;
export const THIN_LINE_OPEN_KERNEL_PX = 3;
export const WALL_CLOSE_KERNEL_PX = 5;
export const MIN_WALL_RUN_PX = 20;
/** 런 길이가 두께의 이 배수 이하면 벽 단면(교차 방향 런)으로 보고 버린다 */
export const WALL_CROSS_SECTION_RATIO = 2;

// 방 영역
export const ROOM_MIN_AREA_RATIO = 0.01;

// OCR
export const OCR_UPSCALE = 3;
export const OCR_DIGIT_WHITELIST = "0123456789";
export const OCR_LANGS = "kor+eng";

// 라벨 매핑
export const LABEL_PRIORITY: RoomLabel[] = ["현관", "욕실", "주방", "식당", "거실", "침실", "발코니", "반침", "드레스룸", "기타"];
export const LABEL_ALIASES: Record<RoomLabel, string[]> = {
  현관: ["현관", "입구", "entrance"],
  욕실: ["욕실", "화장실", "bath", "toilet"],
  주방: ["주방", "키친", "kitchen"],
  식당: ["식당", "다이닝", "dining"],
  거실: ["거실", "리빙", "living"],
  침실: ["침실", "안방", "bed", "방"],
  발코니: ["발코니", "베란다", "balcony"],
  반침: ["반침", "수납", "창고", "closet"],
  드레스룸: ["드레스룸", "dress"],
  기타: []
};
export const LABEL_EXACT_CONFIDENCE = 1;
export const LABEL_PARTIAL_CONFIDENCE = 0.75;
export const LABEL_TYPO_CONFIDENCE = 0.6;
export const LABEL_UNKNOWN_CONFIDENCE = 0.2;
export const LABEL_TYPO_MAX_DISTANCE = 1;
export const LABEL_MIN_ALIAS_LENGTH_FOR_TYPO = 2;

// 스케일(치수 체인)
export const DIMENSION_CHAIN_SUM_TOLERANCE = 0.01;
export const DIMENSION_SUBSET_MAX = 8;
export const SCALE_CHAIN_CONFIDENCE = 0.95;
export const SCALE_MAX_FALLBACK_CONFIDENCE = 0.6;

// 기하
export const DOUGLAS_PEUCKER_EPSILON_PX = 4;
export const DEFAULT_EXTERIOR_WALL_MM = 150;
export const DEFAULT_INTERIOR_WALL_MM = 100;
/** 세그먼트 양끝이 크롭 가장자리에서 이 거리 이내면 외벽으로 본다 */
export const EXTERIOR_EDGE_TOLERANCE_PX = 6;
/**
 * 가로 치수 숫자를 읽을 띠의 높이 = 크롭 높이 × 이 비율.
 * 치수선과 인출선이 도면 위쪽에 여러 단으로 쌓이므로 넉넉해야 숫자에 닿는다.
 */
export const DIMENSION_BAND_RATIO = 0.5;
/**
 * 띠의 좌우 여유 = 크롭 폭 × 이 비율.
 * 세로 치수(깊이)는 도면 왼쪽·오른쪽 열에 있으므로 좁게 잡아 섞이지 않게 한다.
 */
export const DIMENSION_BAND_X_MARGIN_RATIO = 0.1;
export const MASK_ON_VALUE = 255;
export const MAX_GRAY = 255;

// 개구부(문/창) — 같은 축선 위 벽 세그먼트 사이의 빈 구간을 개구부로 본다
/** 사람이 통과하거나 창이 놓이는 최소 폭. 이보다 좁으면 벽 추출 노이즈로 본다 */
export const OPENING_MIN_MM = 600;
/** 이보다 넓은 빈 구간은 개구부가 아니라 서로 다른 벽으로 본다(오픈 플랜 경계) */
export const OPENING_MAX_MM = 3000;
/** 중심선이 이 범위 안이면 같은 벽 축선으로 묶는다(벽 두께 변동 흡수) */
export const WALL_LINE_GROUP_TOLERANCE_PX = 10;
/** 외벽 개구부 중 이 폭 이하이고 현관에 접하면 현관문으로 본다 */
export const ENTRANCE_DOOR_MAX_MM = 1200;
/** 개구부 중심이 방 bbox에서 이 거리 이내면 그 방에 접한 것으로 본다 */
export const OPENING_ROOM_ADJACENCY_MM = 300;

// 유닛(도면) 영역 검출 — 카탈로그 페이지에서 도면만 잘라낸다
/** 격자 칸 크기 = 짧은 변 × 이 비율. 문·창 틈을 건너뛰어 끊긴 벽을 한 덩어리로 묶는다 */
export const UNIT_REGION_CELL_RATIO = 0.03;
export const UNIT_REGION_CELL_MIN_PX = 8;
export const UNIT_REGION_CELL_MAX_PX = 96;
/** bbox 대비 벽 픽셀 비율 — 벽 네트워크는 성기고, 제목 글자·검은 막대는 꽉 찬다 */
export const UNIT_REGION_MIN_FILL = 0.02;
export const UNIT_REGION_MAX_FILL = 0.35;
/** 이미지 대비 최소 bbox 면적 */
export const UNIT_REGION_MIN_AREA_RATIO = 0.02;
/**
 * 방 분할 전에 메울 최대 벽 틈 = 크롭 짧은 변 × 이 비율.
 * 벽선 위에 세그먼트가 있다는 건 그 선이 방 경계라는 뜻이므로, 개구부가 넓어도 분할할 때는 닫는다.
 * (발코니 창 3m·거실 개구부 3.9m 같은 넓은 개구부까지 포함해야 방이 제대로 나뉜다)
 */
export const SEAL_GAP_RATIO = 0.9;
