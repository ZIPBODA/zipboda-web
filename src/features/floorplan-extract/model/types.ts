import type { RoomLabel } from "@/entities/floorplan";

/** 이미지 픽셀 좌표(좌상단 원점) */
export interface PointPx {
  x: number;
  y: number;
}

/** RGBA 픽셀 버퍼(ImageData와 같은 모양). 바닥 색으로 방 경계를 찾을 때 쓴다 */
export interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** 이진 마스크. 1=벽(또는 대상), 0=배경. row-major */
export interface MaskImage {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface WallSegmentPx {
  a: PointPx;
  b: PointPx;
  thicknessPx: number;
}

export interface RoomRegion {
  id: string;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  /** 영역의 실제 윤곽(크롭 px, 픽셀 모서리 기준). bbox로는 ㄱ자 방의 면적이 부풀어 방끼리 겹친다 */
  polygon: PointPx[];
  areaPx: number;
  touchesBorder: boolean;
}

export interface OcrNumberToken {
  value: number;
  center: PointPx;
}

export interface OcrTextToken {
  text: string;
  center: PointPx;
  /** 글자 상자 크기(원본 px). 글자를 단어로 다시 묶을 때 간격 기준이 된다 */
  width: number;
  height: number;
}

export interface LabelMatch {
  label: RoomLabel;
  confidence: number;
}

export interface ScaleEstimate {
  mmPerPx: number;
  totalMm: number;
  chainMm: number[];
  confidence: number;
}

export type ExtractStage = "preprocess" | "walls" | "rooms" | "labels" | "scale" | "openings" | "normalize";

export interface ExtractProgress {
  stage: ExtractStage;
  ratio: number;
}

/** 원본 이미지에서 잘라낸 유닛 영역(px) */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 작업 해상도 프레임 — 크롭을 WORKING_MM_PER_PX로 다시 샘플링한 결과의 크기와 실제 mm/px */
export interface WorkingFrame {
  width: number;
  height: number;
  mmPerPx: number;
  /** 이 프레임에서 검정 잉크로 판정한 밝기 상한 */
  inkGray: number;
  /** 어두운 픽셀(벽 후보) 상한. 글자 재OCR 때 무늬 바닥을 지우는 이진화 기준 — 가는 글자는 안티에일리어싱으로 잉크보다 밝게 찍힌다 */
  darkGray: number;
}

/**
 * Worker가 반환하는 벽 기하. 세그먼트·마스크 좌표는 작업 프레임 px.
 * 방 분할은 여기에 넣지 않는다 — 가구 윤곽과 벽을 두께(mm)로 가르려면 스케일을 먼저 알아야 한다.
 */
export interface WallGeometry {
  /** 원본 이미지 기준 유닛 크롭(px) — 검수 오버레이가 이 자리에 결과를 겹쳐 그린다 */
  crop: CropRect;
  working: WorkingFrame;
  segments: WallSegmentPx[];
  mask: MaskImage;
  /** 작업 해상도로 샘플링한 크롭 RGBA — 바닥 색 경계를 찾는 데 쓴다 */
  image: RgbaImage;
}

/** 벽 기하 + 스케일을 안 뒤 나눈 방 영역(작업 프레임 px) */
export interface GeometryResult extends WallGeometry {
  regions: RoomRegion[];
}

export type GeometryWorkerRequest =
  | { type: "crop"; imageData: ImageData }
  | { type: "walls"; imageData: ImageData; crop: CropRect; mmPerPx: number };

export type GeometryWorkerResponse =
  | { type: "progress"; progress: ExtractProgress }
  | { type: "crop"; crop: CropRect }
  | { type: "walls"; result: WallGeometry }
  | { type: "error"; message: string };
