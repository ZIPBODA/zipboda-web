"use server";

import { getSubscriptionDetail } from "@/entities/subscription";
import type { MapDetailData } from "@/widgets/subscription-list";

export async function loadMapDetail(id: string): Promise<MapDetailData | null> {
  const detail = await getSubscriptionDetail(id);
  if (!detail) return null;
  const plans = detail.units.flatMap((unit) =>
    unit.unitKey && unit.image2dUrl ? [{ unit: unit.unitKey, image: unit.image2dUrl, has3d: unit.has3d ?? false }] : []
  );
  return { detail, plans };
}
