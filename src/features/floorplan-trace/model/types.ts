import type { DimensionChain, Opening2D, OpeningType, PointMm, PointPx, RoomLabel, ScaleSource } from "@/entities/floorplan";

export type TraceTool = "select" | "wall" | "label" | "opening" | "calibrate";

/** 이미지 px ↔ mm 대응. originPx가 mm (0,0)에 놓인다 */
export interface Calibration {
  mmPerPx: number;
  originPx: PointPx;
  source: ScaleSource;
}

/** 축에 평행한 벽 중심선. 항상 a ≤ b(x 우선, 같으면 z). thicknessMm 0은 벽 없는 방 경계선 */
export interface TraceWall {
  id: string;
  a: PointMm;
  b: PointMm;
  thicknessMm?: number;
}

export interface TraceOpening extends Opening2D {
  id: string;
}

/** 방 이름은 방이 아니라 좌표에 붙인다 — 벽을 고쳐 방이 갈리거나 합쳐져도 그 자리의 이름이 남는다 */
export interface LabelAnchor {
  id: string;
  at: PointMm;
  label: RoomLabel;
}

export interface TraceDocument {
  calibration: Calibration | null;
  walls: TraceWall[];
  openings: TraceOpening[];
  labelAnchors: LabelAnchor[];
  printed: { exclusiveAreaM2?: number; dimensionChains: DimensionChain[] };
  /** id 발급 카운터. reducer를 결정적으로 유지한다 */
  seq: number;
}

/** 저장해 두는 작업 파일. 편집 문서에 어느 도면의 무엇인지를 얹는다 */
export interface TraceFile {
  version: number;
  name: string;
  imageUrl: string;
  document: TraceDocument;
}

export type Selection = { kind: "wall"; id: string } | { kind: "opening"; id: string } | null;

export interface WallDraft {
  start: PointMm;
  current: PointMm;
}

export type DragState =
  | { kind: "wall"; id: string; from: PointMm; to: PointMm }
  | { kind: "endpoint"; id: string; end: "a" | "b"; from: PointMm; to: PointMm }
  | { kind: "opening"; id: string; from: PointMm; to: PointMm };

export interface OpeningPreset {
  type: OpeningType;
  widthMm: number;
}

export interface TraceUiState {
  tool: TraceTool;
  selection: Selection;
  wallDraft: WallDraft | null;
  drag: DragState | null;
  labelPickerAt: PointMm | null;
  calibratePoints: PointPx[];
  openingPreset: OpeningPreset;
  /** 벽 도구가 벽 대신 경계선(두께 0)을 그린다 */
  drawBoundary: boolean;
}

export interface TraceState {
  present: TraceDocument;
  past: TraceDocument[];
  future: TraceDocument[];
  ui: TraceUiState;
}

/** 위젯이 포인터 이벤트를 좌표로 바꿔 넘긴다. 캘리브레이션 전에는 mm가 없다 */
export interface PointerSample {
  px: PointPx;
  mm: PointMm | null;
  toleranceMm: number;
}

export type TraceAction =
  | { type: "SET_TOOL"; tool: TraceTool }
  | { type: "POINTER_DOWN"; at: PointerSample }
  | { type: "POINTER_MOVE"; at: PointerSample }
  | { type: "POINTER_UP"; at: PointerSample }
  | { type: "CANCEL" }
  | { type: "DELETE_SELECTION" }
  | { type: "SET_LABEL"; at: PointMm; label: RoomLabel; roomPolygon: PointMm[] }
  | { type: "SET_OPENING_PRESET"; preset: OpeningPreset }
  | { type: "SET_DRAW_BOUNDARY"; value: boolean }
  | { type: "UPDATE_OPENING"; id: string; patch: Partial<Pick<TraceOpening, "type" | "widthMm" | "offsetMm">> }
  | { type: "UPDATE_WALL"; id: string; patch: Pick<TraceWall, "thicknessMm"> }
  | { type: "COMMIT_CALIBRATION"; distanceMm: number }
  | { type: "SET_SCALE"; mmPerPx: number }
  | { type: "SET_PRINTED"; patch: Partial<TraceDocument["printed"]> }
  | { type: "LOAD_DOCUMENT"; document: TraceDocument }
  | { type: "UNDO" }
  | { type: "REDO" };

export interface DerivedRoom {
  key: string;
  polygon: PointMm[];
  areaM2: number;
  /** 이름표를 놓을 자리. ㄱ자 방에서도 방 안에 들어간다 */
  labelAt: PointMm;
}

export interface LabeledRoom extends DerivedRoom {
  label: RoomLabel;
  anchorId: string | null;
}

export interface DerivedLayout {
  rooms: DerivedRoom[];
  outline: PointMm[];
  exteriorWallIds: Set<string>;
  /** 다른 벽에 닿지 않은 끝점 — 방이 안 닫히는 이유를 보여준다 */
  openEndpoints: PointMm[];
}

export interface Projection {
  toPx: (p: PointMm) => PointPx;
  toMm: (p: PointPx) => PointMm;
}
