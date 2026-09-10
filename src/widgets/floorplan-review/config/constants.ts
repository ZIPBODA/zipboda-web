import type { ExtractStage } from "@/features/floorplan-extract";

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

// SVG 속성은 클래스 토큰을 못 쓰므로 디자인 토큰 값(P7)을 상수로 고정
export const OVERLAY_COLOR = {
  crop: "#2B7FFF",
  room: "#FFBA17",
  roomFill: "rgba(255, 186, 23, 0.15)",
  exteriorWall: "#111111",
  interiorWall: "#6A7282",
  label: "#111111"
} as const;

export const OVERLAY_STROKE_PX = { crop: 2, exteriorWall: 4, interiorWall: 3, room: 1.5 } as const;
export const OVERLAY_LABEL_FONT_PX = 12;
export const PERCENT = 100;
