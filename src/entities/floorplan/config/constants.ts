import type { FloorplanViewMode, NormalizeFlagCode, RoomLabel, Viewpoint } from "../model/types";

export const VIEW_MODES: readonly FloorplanViewMode[] = ["2D", "3D"] as const;
export const DEFAULT_VIEW_MODE: FloorplanViewMode = "2D";

// ITF-013 시점(3D 뷰어)
export const VIEWPOINTS: readonly Viewpoint[] = ["1인칭", "3인칭"] as const;
export const DEFAULT_VIEWPOINT: Viewpoint = "1인칭";

// 3D 워크스루 씬 상수(미터·초·도 단위)
export const CEILING_HEIGHT_M = 2.4;
export const WALL_THICKNESS_M = 0.1;
export const EYE_HEIGHT_M = 1.6;
export const WALK_SPEED_MPS = 2.4;
export const CAMERA_FOV = 70;
/** 카메라가 벽에 파고들지 않도록 유지하는 최소 간격(미터) */
export const COLLISION_PADDING_M = 0.25;
// 개구부 절개 높이(미터) — 문은 바닥~문높이, 창은 실~창높이 구간을 비운다
export const DOOR_HEIGHT_M = 2.1;
export const WINDOW_SILL_M = 0.9;
export const WINDOW_TOP_M = 2.1;
export const MM_PER_M = 1000;

// 벽 마스크 → 방 영역(px). 자동 추출과 수기 트레이서가 같은 플러드필을 쓴다
export const ROOM_MIN_AREA_RATIO = 0.012;
export const DOUGLAS_PEUCKER_EPSILON_PX = 4;

// 자동 추출 모델 정규화·검증 기준(mm·비율). 소형 공공임대 도면은 직교 레이아웃이라 그리드 스냅이 유효하다
export const NORMALIZE_GRID_MM = 50;
export const POINT_MERGE_TOLERANCE_MM = 20;
export const SCALE_TOLERANCE = 0.02;
export const AREA_TOLERANCE = 0.05;
/**
 * 방 폴리곤이 외곽을 얼마나 채워야 하는지. 추출된 방은 벽과 설비 그림(발코니 난간·욕실
 * 기구·주방 가구)을 뺀 빈 공간이라 인쇄 면적을 그대로 채울 수 없다.
 * 실측(test2.jpg): 여섯 공간을 모두 찾은 정상 추출이 74%, 크롭이 어긋난 실패가 1~9%였다.
 * 초기값 0.9는 사람이 작성한 이상적인 모델을 전제한 값이라 실제 추출에서는 늘 걸렸다.
 */
export const TILING_MIN_COVERAGE = 0.6;
export const TILING_MAX_COVERAGE = 1.02;
export const TILING_OVERLAP_TOLERANCE_MM2 = 50_000;
export const OPENING_LENGTH_TOLERANCE_MM = 20;
export const DOOR_ADJACENCY_TOLERANCE_MM = 150;
/** 벽 없이 맞닿은 방 경계가 이 폭 이상 열려 있으면 문 없이도 통행 가능한 개방 통로로 본다 */
export const OPEN_PASSAGE_MIN_MM = 600;
export const AUTO_ACCEPT_CONFIDENCE = 0.85;
/** 전용면적·타일링 검증에서 제외하는 방(전용면적표에 미포함) */
export const AREA_EXCLUDED_LABELS: RoomLabel[] = ["발코니"];
/** 도달성 검증에서 제외하는 방 — 반침은 벽 개구부가 아니라 미닫이·접이문으로 여는 수납이다 */
export const REACHABILITY_EXEMPT_LABELS: RoomLabel[] = ["반침"];
/** 이름 없는 방이 이 면적(㎡) 이하면 PS·실외기실 같은 설비 공간으로 보고 도달성을 묻지 않는다 */
export const REACHABILITY_EXEMPT_UNLABELED_MAX_M2 = 1.5;
export const ENTRANCE_LABEL: RoomLabel = "현관";
export const CONFIDENCE_PENALTY: Record<NormalizeFlagCode, number> = {
  "geometry-invalid": 1,
  "room-outside": 1,
  "scale-mismatch": 0.15,
  "scale-no-chain": 0.1,
  "area-mismatch": 0.15,
  "tiling-gap": 0.2,
  "tiling-overlap": 0.2,
  "opening-invalid": 0.15,
  "unreachable-room": 0.2,
  "no-doors": 0.2
};
