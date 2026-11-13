import { HOUSING_FLOORPLANS } from "./housingFloorplans";
import type { Floorplan } from "../model/types";

/** 도면 이미지·3D 모델은 관리자 업로드(S4) 전까지 web 자산이다. API가 준 도면 id로 찾는다 */
export async function getFloorplan(floorplanId: string): Promise<Floorplan | null> {
  return HOUSING_FLOORPLANS.find((floorplan) => floorplan.id === floorplanId) ?? null;
}
