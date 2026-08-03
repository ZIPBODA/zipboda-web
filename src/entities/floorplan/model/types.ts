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
}

export interface Floorplan {
  id: string;
  subscriptionId: string;
  size: number;
  type: string;
  rooms: FloorplanRoom[];
  has3d: boolean;
}
