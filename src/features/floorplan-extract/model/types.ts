import type { RoomLabel } from "@/entities/floorplan";

/** 이미지 픽셀 좌표(좌상단 원점) */
export interface PointPx {
  x: number;
  y: number;
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

/** Worker가 반환하는 기하 결과. 좌표는 crop 기준 px */
export interface GeometryResult {
  crop: CropRect;
  segments: WallSegmentPx[];
  regions: RoomRegion[];
}

export type GeometryWorkerRequest = { type: "geometry"; imageData: ImageData };

export type GeometryWorkerResponse =
  | { type: "progress"; progress: ExtractProgress }
  | { type: "geometry"; result: GeometryResult }
  | { type: "error"; message: string };
