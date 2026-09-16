import type { ExtractStage } from "@/features/floorplan-extract";
import type { TraceTool } from "@/features/floorplan-trace";

/** 치수 체인이 유닛 바깥에 인쇄된 원본 카탈로그 페이지여야 스케일 OCR이 가능하다 */
export const DEFAULT_IMAGE_URL = "/mock/test2.jpg";

export const STAGE_LABELS: Record<ExtractStage, string> = {
  preprocess: "전처리",
  walls: "벽 검출",
  rooms: "방 분할",
  labels: "라벨 OCR",
  scale: "스케일 추정",
  openings: "개구부",
  normalize: "정규화·검증"
};

export const TOOL_LABELS: Record<TraceTool, { label: string; key: string; hint: string }> = {
  select: { label: "선택", key: "V", hint: "벽·문을 클릭해 선택, 끌어서 이동. Delete로 삭제" },
  wall: { label: "벽", key: "W", hint: "클릭-클릭으로 벽을 이어 그린다. Esc·더블클릭으로 끝" },
  label: { label: "이름", key: "L", hint: "방 안을 클릭해 이름을 고른다" },
  opening: { label: "문/창", key: "O", hint: "벽 위를 클릭해 문 또는 창을 놓는다. D로 종류 전환" },
  calibrate: { label: "스케일", key: "C", hint: "인쇄 치수의 양 끝을 클릭한 뒤 실측(mm)을 입력한다" }
};

// SVG 속성은 클래스 토큰을 못 쓰므로 디자인 토큰 값(P7)을 상수로 고정
export const OVERLAY_COLOR = {
  crop: "#2B7FFF",
  room: "#FFBA17",
  roomFill: "rgba(255, 186, 23, 0.15)",
  exteriorWall: "#111111",
  interiorWall: "#6A7282",
  label: "#111111",
  door: "#00BC7D",
  window: "#2B7FFF",
  band: "#F59E0B",
  token: "#FF6467",
  selection: "#2B7FFF",
  draft: "#6A7282",
  openEndpoint: "#FF6467",
  anchor: "#00BC7D",
  calibrate: "#F59E0B",
  handle: "#FFFFFF",
  boundary: "#F59E0B"
} as const;

export const OVERLAY_STROKE_PX = { crop: 2, exteriorWall: 4, interiorWall: 3, boundary: 2, room: 1.5, opening: 5, draft: 2, selection: 6 } as const;
export const OVERLAY_LABEL_FONT_PX = 12;
/** 선택·스냅 판정 반경(이미지 px) — 벽 두께보다 조금 넉넉해야 클릭이 잡힌다 */
export const HIT_RADIUS_PX = 8;
export const HANDLE_RADIUS_PX = 5;
export const OPENING_MARKER_RADIUS_PX = 6;
export const PERCENT = 100;
/** 내려받은 모델 파일명 — entities/floorplan의 목 자산과 같은 이름으로 맞춘다 */
export const MODEL_FILE_NAME = "fp-test2.model2d.json";
/** 캔버스 확대 단계. 원본이 컨테이너보다 크면 시작 배율은 폭 맞춤이다 */
export const ZOOM_STEPS = [0.25, 0.35, 0.5, 0.75, 1, 1.5, 2] as const;
export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];
/** 벽 두께 입력 프리셋(mm) — 도면 외벽·내벽·경량 칸막이 */
export const WALL_THICKNESS_OPTIONS = [200, 150, 100, 60] as const;
