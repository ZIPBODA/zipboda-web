export { extractFloorplan, type ExtractOptions, type ExtractOutput } from "./lib/extractFloorplan";
export { assembleModel, type AssembleInput } from "./lib/assembleModel";
export { mapRoomLabel } from "./lib/labelMap";
export { estimateScale, areaDeviation } from "./lib/scaleFromChains";
export type {
  PointPx,
  MaskImage,
  WallSegmentPx,
  RoomRegion,
  OcrNumberToken,
  LabelMatch,
  ScaleEstimate,
  ExtractStage,
  ExtractProgress,
  CropRect,
  GeometryResult
} from "./model/types";
