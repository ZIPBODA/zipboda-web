import type { RoomLabel } from "@/entities/floorplan";

/**
 * 작업 해상도(mm/px). 크롭·스케일을 알아낸 뒤 유닛 영역을 이 해상도로 다시 샘플링해 벽·방을 뽑는다.
 * 형태학 커널·최소 런·그룹 허용치 같은 px 상수는 모두 이 해상도 기준이다(실측 튠 원본 test2.jpg가 13.6mm/px).
 * 같은 도면을 절반 해상도로 넣으면 벽이 4px로 얇아져 방이 뭉치고, 두 배로 넣으면 치수선이 벽으로 남는다 —
 * 입력 해상도가 아니라 실제 치수 기준으로 처리해야 어떤 스캔이든 같은 결과가 나온다.
 */
export const WORKING_MM_PER_PX = 12;
/** 크롭 검출(1차)은 원본에서 하되, 너무 큰 스캔은 이 긴 변으로 줄여 가는 선이 벽 마스크에 남지 않게 한다 */
export const CROP_PASS_MAX_LONG_EDGE_PX = 2400;

// 벽 마스크 — LH/SH 도면의 벽은 굵은 검정 실선, 치수선·글자는 가는 선이라 임계+형태학으로 분리된다.
// 임계는 고정값이 아니라 크롭의 밝기 분포에서 정한다(스캔마다 검정·종이 밝기가 다르다)
/** 검정점·흰점을 잡는 백분위. 극단 1%는 잡음·압축 아티팩트다 */
export const WALL_BLACK_PERCENTILE = 0.01;
export const WALL_WHITE_PERCENTILE = 0.99;
/** 어두운 픽셀(벽 후보) 상한 = 검정점 + (흰점 − 검정점) × 이 비율. 실측(test2.jpg) 검정 40·흰 250 → 134 */
export const WALL_DARK_RATIO = 0.45;
/**
 * 잉크 경계는 어두운 픽셀만 모아 Otsu로 찾는다. 실측(test2.jpg): 벽 gray 55~62, 주방가구·침대·신발장 같은
 * 갈색·회색 가구는 103~200으로 사이(70~100)가 비어 골이 뚜렷하다. 골이 검정점·어두운 상한에서
 * 이 여유보다 가까우면 가구가 없는 단봉 분포로 보고 중간값으로 물러선다.
 */
export const INK_OTSU_MIN_MARGIN = 12;
export const INK_SPLIT_RATIO = 0.5;
/** 세그먼트 몸통 픽셀 중 잉크 비율이 이 값 이상이면 벽. 실측 벽 0.83~1.0, 가구 0~0.27 */
export const WALL_INK_MIN_RATIO = 0.5;
export const THIN_LINE_OPEN_KERNEL_PX = 3;
export const WALL_CLOSE_KERNEL_PX = 5;
export const MIN_WALL_RUN_PX = 20;
/** 런 길이가 두께의 이 배수 이하면 벽 단면(교차 방향 런)으로 보고 버린다 */
export const WALL_CROSS_SECTION_RATIO = 2;
/**
 * 한 클러스터 안에서 위치별 두께가 중앙값에서 이 비율 이상 벗어나면 다른 벽(또는 벽에 붙은 상자)으로 쪼갠다.
 * 벽 두께는 도면 위에서 거의 일정하고, PS 상자·가구가 붙은 구간은 두 배 이상 두꺼워진다.
 */
export const WALL_PROFILE_TOLERANCE_RATIO = 0.34;

// OCR
/**
 * 확대 배율은 도면 해상도에 맞춘다.
 * 글자 크기는 이미지 해상도에 비례하므로, 저해상도 도면(예: 558px 폭)은 고정 배율로 확대하면
 * 치수 글자가 20px에 못 미쳐 Tesseract가 읽지 못한다.
 */
export const OCR_REFERENCE_WIDTH_PX = 1600;
export const OCR_BASE_UPSCALE = 3;
export const OCR_UPSCALE_MIN = 3;
export const OCR_UPSCALE_MAX = 8;
export const OCR_LANGS = "kor+eng";

// 라벨 매핑
export const LABEL_PRIORITY: RoomLabel[] = ["현관", "욕실", "주방", "식당", "거실", "침실", "발코니", "반침", "드레스룸", "기타"];
export const LABEL_ALIASES: Record<RoomLabel, string[]> = {
  현관: ["현관", "입구", "entrance"],
  욕실: ["욕실", "화장실", "bath", "toilet"],
  주방: ["주방", "키친", "kitchen"],
  식당: ["식당", "다이닝", "dining"],
  거실: ["거실", "리빙", "living"],
  // "방" 한 글자는 주방·안방·서재 등 어디에나 들어가 오탐을 부른다 — 쓰지 않는다
  침실: ["침실", "안방", "bed"],
  발코니: ["발코니", "베란다", "balcony"],
  반침: ["반침", "수납", "창고", "closet"],
  드레스룸: ["드레스룸", "dress"],
  기타: []
};
export const LABEL_EXACT_CONFIDENCE = 1;
export const LABEL_PARTIAL_CONFIDENCE = 0.75;
export const LABEL_TYPO_CONFIDENCE = 0.6;
/** 글자는 다 맞고 순서만 뒤바뀐 경우("침반"→반침). 한 글자가 틀린 오탈자("침반"→침실)보다 믿을 만하다 */
export const LABEL_TRANSPOSE_CONFIDENCE = 0.7;
export const LABEL_UNKNOWN_CONFIDENCE = 0.2;
export const LABEL_TYPO_MAX_DISTANCE = 1;
/**
 * 자모로 편 뒤 허용할 편집 거리. OCR이 작은 한글의 받침을 자주 놓친다("현관" → "혀과").
 * 실측상 서로 다른 방 이름은 자모 거리가 3 이상이라 2까지는 오탐 없이 흡수된다.
 */
export const LABEL_JAMO_MAX_DISTANCE = 2;
export const LABEL_JAMO_CONFIDENCE = 0.5;
export const LABEL_MIN_ALIAS_LENGTH_FOR_TYPO = 2;
/** 크롭 전체 OCR이 이름을 못 읽은 방 중 이 면적(㎡)을 넘는 방만 확대해 다시 읽는다(PS·설비 공간 제외) */
export const LABEL_RETRY_MIN_ROOM_M2 = 1.5;
/** 재OCR 확대 배율(전체 읽기 배율에 곱한다). 방 하나만 읽으므로 더 키워도 비용이 작다 */
export const LABEL_RETRY_UPSCALE_FACTOR = 1.5;

// 스케일(치수 체인)
/**
 * 치수로 인정할 값의 범위(mm).
 * 도면 옆에는 제목·면적·호수 숫자도 인쇄돼 있고, 숫자 화이트리스트가 한글·소수점을 버리면서
 * "51형 51.93 (180호)" 가 515193180 한 덩어리로 읽히기도 한다.
 * 주거 유닛의 한 변은 현실적으로 이 범위 안이므로, 벗어난 값은 치수가 아니다.
 */
export const DIMENSION_MIN_MM = 500;
export const DIMENSION_MAX_MM = 20000;
/** 분할 치수만 인쇄되고 전체 치수가 없을 때 — 합을 전체로 보되 확신은 낮춘다 */
export const SCALE_CHAIN_PARTITION_CONFIDENCE = 0.8;
export const DIMENSION_CHAIN_SUM_TOLERANCE = 0.01;
export const DIMENSION_SUBSET_MAX = 8;
export const SCALE_CHAIN_CONFIDENCE = 0.95;
export const SCALE_MAX_FALLBACK_CONFIDENCE = 0.6;
/** 인쇄 전용면적에서 역산한 스케일 — 벽·발코니가 섞여 치수 체인보다는 거칠다 */
export const SCALE_AREA_CONFIDENCE = 0.7;

// 기하
/**
 * 벽으로 인정할 최소 두께(mm).
 * 도면에는 침대·설비가 가는 윤곽선(14~55mm)으로 그려져 있어 그대로 두면 3D에서 벽으로 선다.
 * 가구는 잉크 판정이 먼저 걸러내므로 두께 하한은 선(치수선·확장 점선 41mm)만 막으면 된다.
 * 가장 얇은 실제 벽(욕실 칸막이)은 원본에서 95mm, 어두운 스캔에서는 72mm까지 읽혀 80으로 두면 사라졌다.
 */
export const MIN_WALL_THICKNESS_MM = 60;
/**
 * 벽으로 인정할 최대 두께(mm). 이보다 두꺼운 덩어리는 벽이 아니라 채워 그린 그림(PS 상자·난간 띠)이다.
 * 실측 외벽은 300mm까지 그려지고, 벽에 붙은 상자는 400mm를 훌쩍 넘는다.
 */
export const MAX_WALL_THICKNESS_MM = 400;
/** 이보다 짧은 벽 조각(발코니 확장선 끝·창호 표기 토막)은 벽이 아니라 잡음이다 */
export const MIN_WALL_LENGTH_MM = 500;
/**
 * 외벽 두께 상한(mm). 도면 외곽은 외벽+단열+마감을 한 덩어리로 칠해 300mm를 넘기도 하는데,
 * 그대로 세우면 실내가 좁아지고 외곽선과 벽 사이에 틈이 생긴다. 상한으로 자르고 외곽선에 붙인다.
 */
export const MAX_EXTERIOR_WALL_MM = 300;
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
/**
 * 외벽 개구부 중심이 "현관" 글자에서 이 거리 이내면 현관문으로 본다.
 * 현관은 벽 없이 주방·거실로 이어져 별도 방으로 안 잡히는 경우가 많아, 글자 위치로 보완한다.
 * 현관 폭은 1~1.5m라 글자와 문 사이는 그 안에 든다.
 */
export const ENTRANCE_HINT_RADIUS_MM = 1500;

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
 * 유닛 후보 점수용 "굵은 획" 열림 반지름 = 긴 변 × 이 비율(2338px에서 3px, 커널 7).
 * 벽은 이보다 굵고 표 선·글자·치수선·단지배치도는 가늘어 지워진다. 저해상도(≤800px)에서는 1px로 내려가 효과가 없다
 */
export const UNIT_CORE_OPEN_RATIO = 0.0013;
/**
 * 방 분할 전에 메울 최대 벽 틈 = 크롭 짧은 변 × 이 비율.
 * 벽선 위에 세그먼트가 있다는 건 그 선이 방 경계라는 뜻이므로, 개구부가 넓어도 분할할 때는 닫는다.
 * (발코니 창 3m·거실 개구부 3.9m 같은 넓은 개구부까지 포함해야 방이 제대로 나뉜다)
 */
export const SEAL_GAP_RATIO = 0.9;

// 바닥 색 경계 — 벽 없이 바닥 마감재만 바뀌는 방 경계(주방/거실 등)를 찾는다
/** 색 평균을 낼 블록 한 변(px). 나뭇결·타일 무늬를 평균으로 지울 만큼 커야 한다 */
export const COLOR_BLOCK_PX = 8;
/**
 * 색 경계 임계는 크롭 안 이웃 블록 거리 분포에서 정한다 = 상위 백분위 값 × 비율(하한 있음).
 * 고정값 35는 원본에서만 맞았다 — 어두운 스캔(감마 0.6)은 바닥 색 차이가 반으로 줄어 경계가 끊기고,
 * 밝은 스캔은 무늬 노이즈까지 경계로 잡힌다. 실측 p90: 원본 81, 어두움 61, 밝음 95, 75% 축소 72.
 */
export const COLOR_BOUNDARY_PERCENTILE = 0.9;
export const COLOR_BOUNDARY_RATIO = 0.5;
export const COLOR_BOUNDARY_MIN_THRESHOLD = 15;
/**
 * 색 경계로 인정할 최소 길이 = 그 축 블록 수 × 이 비율.
 * 방을 가르는 선은 한 변을 가로지르지만, 가구·설비 둘레는 짧게 끊긴다.
 */
export const COLOR_BOUNDARY_MIN_RUN_RATIO = 0.35;
/**
 * 색 경계 구간을 벽까지 늘릴 때 허용하는 최대 틈 = 그 축 길이 × 이 비율.
 * 방 경계는 벽에서 벽까지 이어지지만 냉장고·싱크대 같은 회색 가구가 놓인 끝은 색 차가 작아 짧게 끊긴다(실측 7~11%).
 * 그보다 크게 비면 벽까지 안 가는 가구 둘레·발코니 확장선이므로 늘리지 않는다.
 */
export const COLOR_BOUNDARY_MAX_EXTEND_RATIO = 0.3;
/**
 * 블록 안 벽 픽셀 비율이 이 값을 넘으면 그 블록이 낀 색 차이는 바닥 경계가 아니라 벽↔바닥 대비다.
 * 그런 선은 벽 안쪽 한 블록 자리에 벽과 나란히 그어져 벽과 선 사이에 1~2px 통로를 만들고, 방이 그 통로로 샌다.
 */
export const COLOR_BOUNDARY_MAX_WALL_FRACTION = 0.3;
/**
 * 축 길이 비율에는 못 미쳐도 양 끝이 모두 벽에 닿는 색 경계는 방 경계다(현관 타일↔주방 마루, 1550mm = 폭의 34%).
 * 가구 둘레는 한쪽 끝이 방 가운데에서 끝나 여기 걸리지 않는다. 문 폭(600mm)보다 짧은 것은 표기 조각이다.
 * 실측: 현관 경계는 양 끝 블록의 색 차가 약해 뚜렷한 구간이 770mm로 읽혔다
 */
export const COLOR_BOUNDARY_WALL_TO_WALL_MIN_MM = 600;
/**
 * 색 경계로만 갈린 조각이 이 면적(㎡) 아래면 방이 아니라 바닥 표기(샤워 트레이·세면대 자리)다.
 * 그 조각에 닿은 색 경계만 지우고 다시 나눈다. 벽으로 갈린 작은 공간(반침·PS)은 건드리지 않는다
 */
export const COLOR_SPLIT_MIN_ROOM_M2 = 1.0;

// 글자 묶기 — Tesseract가 한글을 글자 단위로 쪼개 내놓아 "주방/식당"이 주·방·/·식·당으로 나온다
/** 같은 줄로 볼 세로 허용치 = 글자 높이 × 이 비율 */
export const TOKEN_LINE_TOLERANCE_RATIO = 0.6;
/** 같은 단어로 볼 가로 간격 상한 = 글자 높이 × 이 비율 */
export const TOKEN_MERGE_GAP_RATIO = 0.8;

/**
 * 방 분할 전에 벽을 깎는 두께 = 실제 벽 두께 중앙값 × 이 비율.
 * 방 영역은 벽을 뺀 빈 공간이라 인쇄 면적(벽 중심선 기준)보다 작게 나온다. 이상적으로는 절반이지만,
 * 벽이 아닌 경계(주방↔거실 색 경계, 반침 앞 선반선)는 중심선을 되그릴 수 없어 절반을 깎으면 끊긴다.
 * 실측(test2.jpg): 절반(6px)에서 주방·거실·반침이 한 방으로 뭉쳤고, 1/4(3px)에서 방 7개가 유지됐다(면적 -5.7%).
 */
export const WALL_ERODE_RATIO = 0.25;
export const WALL_ERODE_MAX_PX = 8;
/**
 * 벽이 아닌 "굵은 그림"으로 볼 두께 = 실제 벽 두께 중앙값 × 이 비율.
 * 실측(test2.jpg): 벽은 9~18px인데 발코니 난간·창이 28·43px 띠로 잡혀 방 면적을 먹었다.
 * 벽 두께의 두 배를 넘는 덩어리는 벽이 아니라 그림으로 본다.
 */
export const THICK_GRAPHIC_RATIO = 2;

