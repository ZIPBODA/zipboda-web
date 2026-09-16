export { useTraceEditor } from "./model/useTraceEditor";
export { documentFromModel, emptyDocument } from "./lib/documentFromModel";
export { deriveLayout } from "./lib/deriveLayout";
export { resolveRoomLabels, roomAt } from "./lib/labelAnchors";
export { createProjection } from "./lib/projection";
export { pointOnWall, wallLengthMm } from "./lib/wallOps";
export { isBoundary } from "./lib/snap";
export { BOUNDARY_THICKNESS_MM, BOUNDARY_TOGGLE_KEY, CALIBRATION_POINTS, OPENING_PRESETS, ROOM_LABEL_OPTIONS, TOOL_SHORTCUTS } from "./config/constants";
export type {
  Calibration,
  DerivedLayout,
  DerivedRoom,
  DragState,
  LabelAnchor,
  LabeledRoom,
  OpeningPreset,
  PointerSample,
  Projection,
  Selection,
  TraceAction,
  TraceDocument,
  TraceOpening,
  TraceState,
  TraceTool,
  TraceUiState,
  TraceWall,
  WallDraft
} from "./model/types";
