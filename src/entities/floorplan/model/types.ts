export type FloorplanViewMode = "2D" | "3D";

export type Viewpoint = "1인칭" | "3인칭";

export interface FloorplanRoom {
  name: string;
  dimensions: string;
  area: string;
}

/** 메인 '인터랙티브 평면도' 섹션에 노출하는 대표 평면도 */
export interface FloorplanShowcase {
  id: string;
  size: number;
  type: string;
  summary: string;
  has2d: boolean;
  has3d: boolean;
  image: string;
}

export interface Floorplan {
  id: string;
  subscriptionId: string;
  size: number;
  type: string;
  rooms: FloorplanRoom[];
  has3d: boolean;
  /** LH/SH 2D 평면도 이미지 — 2D 뷰 */
  image2dUrl: string;
  /** 도면 이미지에서 추출·검수한 2D 구조 모델(mm). 없으면 3D 뷰는 준비 중 상태 */
  model2d?: FloorplanModel2D;
}

/** 추출 모델 좌표(mm). 좌상단 원점, x→오른쪽, z→아래(깊이) */
export interface PointMm {
  x: number;
  z: number;
}

export type RoomLabel = "거실" | "침실" | "주방" | "식당" | "욕실" | "현관" | "발코니" | "반침" | "드레스룸" | "기타";

export interface Room2D {
  id: string;
  label: RoomLabel;
  polygon: PointMm[];
  areaM2?: number;
}

export interface Wall2D {
  id: string;
  a: PointMm;
  b: PointMm;
  thicknessMm: number;
  exterior: boolean;
}

export type OpeningType = "door" | "window";

export interface Opening2D {
  wallId: string;
  type: OpeningType;
  /** 벽 시작점(a)에서 개구부 시작까지 거리 */
  offsetMm: number;
  widthMm: number;
  swing?: "in" | "out";
}

export type FixtureType = "toilet" | "sink" | "kitchen" | "washer";

export interface Fixture2D {
  type: FixtureType;
  roomId: string;
  polygon: PointMm[];
}

export interface DimensionChain {
  axis: "x" | "z";
  values: number[];
}

export type ScaleSource = "dimension-chain" | "area" | "estimated";

/** 도면 이미지에서 자동 추출한 2D 구조 모델(mm) */
export interface FloorplanModel2D {
  scale: { mmPerPx: number; source: ScaleSource };
  outline: PointMm[];
  rooms: Room2D[];
  walls: Wall2D[];
  openings: Opening2D[];
  fixtures?: Fixture2D[];
  printed: { exclusiveAreaM2?: number; dimensionChains: DimensionChain[] };
  confidence: { overall: number; perRoom: Record<string, number> };
}

export type NormalizeFlagCode =
  | "scale-mismatch"
  | "scale-no-chain"
  | "area-mismatch"
  | "tiling-gap"
  | "tiling-overlap"
  | "opening-invalid"
  | "unreachable-room"
  | "no-doors";

export interface NormalizeFlag {
  code: NormalizeFlagCode;
  detail: string;
}

export interface NormalizeResult {
  model: FloorplanModel2D;
  confidence: number;
  flags: NormalizeFlag[];
  autoAccept: boolean;
}
