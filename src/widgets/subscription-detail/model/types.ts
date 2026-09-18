import type { FloorplanViewMode, Viewpoint } from "@/entities/floorplan";

export interface DetailQuery {
  unit?: string | number;
  view?: FloorplanViewMode;
  viewpoint?: Viewpoint;
}

/** 상세 화면 상태(평형·2D/3D·시점)는 URL 쿼리로 유지한다(frontend-rule P6) */
export type DetailHrefBuilder = (next: DetailQuery) => string;
