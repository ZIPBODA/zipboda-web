import { MOCK_FLOORPLAN_SHOWCASE } from "./__mocks__/floorplanShowcase.mock";
import type { FloorplanShowcase } from "../model/types";

// TODO(API-031): 대표 평면도 조회로 교체, mock 제거(A1)
export async function getFeaturedFloorplans(): Promise<FloorplanShowcase[]> {
  return MOCK_FLOORPLAN_SHOWCASE;
}
