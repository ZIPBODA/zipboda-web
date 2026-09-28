"use server";

import { getSubscriptionDetail } from "@/entities/subscription";
import { getFloorplan } from "@/entities/floorplan";
import type { MapDetailData } from "@/widgets/subscription-list";

export async function loadMapDetail(id: string): Promise<MapDetailData | null> {
  const detail = await getSubscriptionDetail(id);
  if (!detail) return null;
  const plans = await Promise.all(detail.units.map(async (unit) => {
    const key = unit.unitKey ?? unit.size;
    if (key === null) return null;
    const plan = await getFloorplan(id, key);
    return plan ? { unit: String(key), image: plan.image2dUrl, has3d: plan.has3d } : null;
  }));
  return { detail, plans: plans.filter((plan) => plan !== null) };
}
