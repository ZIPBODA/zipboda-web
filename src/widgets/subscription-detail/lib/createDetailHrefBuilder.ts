import { DEFAULT_VIEW_MODE, DEFAULT_VIEWPOINT, type FloorplanViewMode, type Viewpoint } from "@/entities/floorplan";
import type { DetailHrefBuilder } from "../model/types";

interface Params {
  id: string;
  defaultUnitSize: number;
  unit: number;
  view: FloorplanViewMode;
  viewpoint: Viewpoint;
}

/** 기본값과 같은 항목은 쿼리에서 빼 URL을 짧게 유지한다(목록 화면 필터와 동일 규칙) */
export function createDetailHrefBuilder({ id, defaultUnitSize, unit, view, viewpoint }: Params): DetailHrefBuilder {
  return (next) => {
    const query = new URLSearchParams();
    const nextUnit = next.unit ?? unit;
    const nextView = next.view ?? view;
    const nextViewpoint = next.viewpoint ?? viewpoint;

    if (nextUnit !== defaultUnitSize) query.set("unit", String(nextUnit));
    if (nextView !== DEFAULT_VIEW_MODE) query.set("view", nextView);
    if (nextViewpoint !== DEFAULT_VIEWPOINT) query.set("viewpoint", nextViewpoint);

    const search = query.toString();
    return search ? `/subscriptions/${id}?${search}` : `/subscriptions/${id}`;
  };
}
