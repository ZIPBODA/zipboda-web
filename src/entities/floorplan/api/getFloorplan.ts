import { MOCK_FLOORPLANS } from "./__mocks__/floorplan.mock";
import type { Floorplan } from "../model/types";

// TODO(API-031): fetch(`/api/floorplans/${id}`)로 교체, mock 제거(A1)
export async function getFloorplan(subscriptionId: string, size: number): Promise<Floorplan | null> {
  return MOCK_FLOORPLANS.find((f) => f.subscriptionId === subscriptionId && f.size === size) ?? null;
}
