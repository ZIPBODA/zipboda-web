import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { HOUSING_FLOORPLANS } from "./housingFloorplans";
import type { FloorplanShowcase } from "../model/types";

export async function getFeaturedFloorplans(): Promise<FloorplanShowcase[]> {
  return HOUSING_SOURCE_DATA.flatMap((property) => {
    const plan = HOUSING_FLOORPLANS.find((item) => item.subscriptionId === property.id && item.has3d);
    if (!plan) return [];
    return [{
      id: plan.id,
      title: property.title,
      size: plan.size,
      type: plan.type,
      summary: `${plan.type ? `${plan.type}타입 · ` : ""}원본 도면 · 3D 탐색`,
      has2d: true,
      has3d: plan.has3d,
      image: plan.image2dUrl,
      href: `/subscriptions/${property.id}/floorplan?unit=${encodeURIComponent(plan.unitKey ?? plan.id)}`
    }];
  }).slice(0, 3);
}
