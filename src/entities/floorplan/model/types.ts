export type FloorplanViewMode = "2D" | "3D";

export type Viewpoint = "1인칭" | "3인칭";

export interface FloorplanRoom {
  name: string;
  dimensions: string;
  area: string;
}

export interface Floorplan {
  id: string;
  subscriptionId: string;
  size: number;
  type: string;
  rooms: FloorplanRoom[];
  has3d: boolean;
}
