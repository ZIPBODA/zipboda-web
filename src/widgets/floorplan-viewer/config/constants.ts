import type { FixtureType, RoomLabel } from "@/entities/floorplan";

// three.js 머티리얼 색은 클래스 토큰을 못 쓰므로 디자인 토큰 값(P7 neutral/brand)을 상수로 고정.
// 벽지 면이 순백이라 벽 단면(끝면·컷어웨이 윗면)·설비는 한 단계 짙게 두어 3인칭에서 윤곽이 읽히게 한다
export const WALL_COLOR = "#D1D5DB";
export const FIXTURE_COLOR = "#9CA3AF";
/** 흰 벽지가 배경에 묻히지 않도록 연한 청회색 — 1인칭은 창 너머 하늘빛, 3인칭은 한 단계 밝게 */
export const SCENE_BACKGROUND = { orbit: "#E5E9EE", walk: "#D6DEE7" } as const;

/** 스키매틱 바닥 채움 — 방 종류 구분만 목적(가구·질감 없음) */
export const ROOM_FLOOR_COLOR: Record<RoomLabel, string> = {
  거실: "#F5E6D3",
  침실: "#F5E6D3",
  주방: "#EAE0D5",
  식당: "#EAE0D5",
  욕실: "#DCE7F0",
  현관: "#E5E7EB",
  발코니: "#D9DEE3",
  반침: "#EDE9E3",
  드레스룸: "#EDE9E3",
  기타: "#F3F4F6"
};

/** 1~2인 공공임대 표준 설비 높이(미터) — 형태 인지용 프리미티브 */
export const FIXTURE_HEIGHT_M: Record<FixtureType, number> = {
  toilet: 0.4,
  sink: 0.85,
  kitchen: 0.9,
  washer: 0.85
};

/** 마감재 타일(scripts/build-textures.mjs 산출, 1024² seamless). 로드 전·실패 시 단색 재질로 폴백 */
export const FINISH_TEXTURE_URL = { wallpaper: "/textures/wallpaper.jpg", flooring: "/textures/flooring.jpg" } as const;
/** 타일 한 장이 덮는 실척(m). 벽지 줄무늬 피치·장판 판 폭 기준 — 제품 규격 확정 시 조정 */
export const FINISH_TILE_M = { wallpaper: 1.0, flooring: 1.2 } as const;
export const TEXTURE_ANISOTROPY = 4;
/**
 * three r155+ 물리 광량: 램버트 출력 = 광량 × 알베도 / π. 흰 마감재(알베도≈0.97)가 흰색(≈0.95)으로 보이도록
 * 수직 벽 기준 ambient/π(0.70) + hemisphere 절반(0.23) ≈ 0.93, 바닥은 여기에 directional 소량이 더해진다
 */
export const SCENE_LIGHT = { ambient: 2.2, hemisphere: 0.9, directional: 0.5 } as const;
/** 마감재 텍스처에 곱하는 틴트 — 원본 사진 색을 그대로 보이게 순백. 방별 색(ROOM_FLOOR_COLOR)은 텍스처 폴백·미니맵 전용 */
export const FINISH_TINT = "#FFFFFF";

export const FLOOR_THICKNESS_M = 0.02;
/** 바닥 슬래브 z-fighting 방지용 미세 부양 */
export const FLOOR_LIFT_M = 0.01;

/** 3인칭 dollhouse는 벽을 낮춰 위에서 방 내부가 보이게 한다 */
export const ORBIT_WALL_HEIGHT_M = 1.2;
export const ORBIT_CAMERA = { heightRatio: 1.15, distanceRatio: 1.1, minDistanceRatio: 0.5, maxDistanceRatio: 2.5, maxPolarRatio: 0.49 } as const;
export const CAMERA_NEAR_M = 0.05;
export const CAMERA_FAR_M = 100;
export const DEVICE_PIXEL_RATIO_RANGE: [number, number] = [1, 1.5];

export const LOOK_SPEED_RAD_PER_S = 1.8;
export const LOOK_DRAG_SENSITIVITY = 0.003;
/** PC Pointer Lock(FPS식) 마우스 시선 — 픽셀당 라디안 */
export const MOUSE_LOOK_SENSITIVITY = 0.002;
export const PITCH_LIMIT_RAD = Math.PI / 3;
/** 탭 전환·프레임 드랍 시 한 프레임에 과도하게 이동하지 않도록 dt 상한(초) */
export const MAX_FRAME_DT_S = 0.05;

// figma 353:3930 미니 도면 캔버스 — 우측 상단 소형 오버레이(정방형이라 가로·세로 유닛 모두 수용). 표시 폭의 2배 해상도로 그려 선명하게
export const MINIMAP_CANVAS = { width: 224, height: 224, padding: 12 } as const;
export const MINIMAP_COLOR = { floor: "#F3F4F6", wall: "#9CA3AF", pose: "#FFBA17", poseStroke: "#FFFFFF", cone: "rgba(255, 186, 23, 0.35)" } as const;
export const MINIMAP_POSE = { radiusPx: 4, coneLengthPx: 20, coneHalfAngleRad: 0.45, wallWidthPx: 2, strokeWidthPx: 1.5 } as const;

/**
 * 씬 검증에서 정상으로 보는 유닛 한 변의 범위(미터).
 * 현재 현황도는 13~35㎡ 원룸(한 변 3~9m)이고, 스케일을 잘못 잡으면 0.3m나 60m 같은 값이 나온다
 */
export const SCENE_EXTENT_M = { min: 1.5, max: 40 } as const;

// 자동 승격(reviewed) 문턱. normalizeModel의 자동 확정 기준(0.85)과 같게 두어 두 판정이 어긋나지 않게 한다
export const REVIEW_MIN_CONFIDENCE = 0.85;
/** 방 하나를 둘러싸는 데 필요한 최소 벽 수 — 이보다 적으면 외곽이 닫히지 않은 추출이다 */
export const REVIEW_MIN_WALLS = 4;

// figma 353:3818 전체화면 뷰어 탭. 단지배치도는 매입임대 단일 건물이라 원본 현황도에 존재하지 않아 두지 않는다
export const FLOORPLAN_TABS = [
  { key: "2d", label: "2D 평면도" },
  { key: "3d", label: "3D 평면도" },
  { key: "location", label: "위치" }
] as const;

export type FloorplanTab = (typeof FLOORPLAN_TABS)[number]["key"];

export const FLOORPLAN_TAB_KEYS: readonly string[] = FLOORPLAN_TABS.map((tab) => tab.key);

export const DEFAULT_FLOORPLAN_TAB: FloorplanTab = "2d";

/**
 * 2D 도면 팬·줌. fit은 배율이 아니라 "여백을 포함해 전체가 보이는 맞춤 상태"다 —
 * 그 아래로 더 줄여도 보이는 것이 늘지 않고 회색 여백만 커지므로 min을 fit과 같게 둔다.
 * 단계는 가산이 아니라 승산이어야 확대·축소 체감이 배율에 관계없이 일정하다
 */
export const SCENE2D_ZOOM = { fit: 1, min: 1, max: 4, factor: 1.3 } as const;
