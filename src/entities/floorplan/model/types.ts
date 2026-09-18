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
  size: number | null;
  type: string;
  summary: string;
  has2d: boolean;
  has3d: boolean;
  image: string;
}

export interface Floorplan {
  layoutKey?: string;
  unitKey?: string;
  sourcePdf?: string;
  sourcePage?: number;
  id: string;
  subscriptionId: string;
  size: number | null;
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

/** 이미지·마스크 픽셀 좌표(좌상단 원점) */
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

/** 벽 마스크의 빈 공간을 플러드필로 나눈 한 영역(px) */
export interface RoomRegion {
  id: string;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  /** 영역의 실제 윤곽(px, 픽셀 모서리 기준). bbox로는 ㄱ자 방의 면적이 부풀어 방끼리 겹친다 */
  polygon: PointPx[];
  areaPx: number;
  touchesBorder: boolean;
}

export interface LabeledRegions {
  regions: RoomRegion[];
  /** 픽셀마다 속한 영역의 인덱스(regions 배열 기준). 벽·너무 작은 성분은 -1 */
  owner: Int32Array;
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
  | "geometry-invalid"
  | "room-outside"
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

/** 검수를 통과해 3D로 내보내는 모델의 출처 기록(models/reviewed.json 한 줄) */
export interface ReviewedModelEntry {
  layoutKey: string;
  property: string;
  method: "extraction" | "traced";
  reviewedAt: string;
  reviewer: string;
  note: string;
  sourcePdf: string;
  sourcePage: number;
  image2dUrl: string;
  /** 모델 (0,0)이 놓인 크롭 이미지 px — 검수 화면이 크롭 위에 모델을 겹칠 때 쓴다 */
  originPx: { x: number; y: number };
}
