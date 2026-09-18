import { HOUSING_FLOORPLANS } from "./housingFloorplans";
import type { Floorplan } from "../model/types";

export async function getFloorplan(subscriptionId: string, unit: string | number): Promise<Floorplan | null> {
  const candidates = HOUSING_FLOORPLANS.filter((floorplan) => floorplan.subscriptionId === subscriptionId);
  const exact = candidates.find((floorplan) => floorplan.unitKey === unit || floorplan.layoutKey === unit);
  if (exact) return exact;
  const matches = candidates.filter((floorplan) => floorplan.size !== null && floorplan.size === Number(unit));
  return matches.length === 1 ? matches[0] : null;
}
