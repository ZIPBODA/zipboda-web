import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import type { Floorplan } from "../model/types";
import { REVIEWED_MODELS } from "./models";

export const HOUSING_FLOORPLANS: Floorplan[] = HOUSING_SOURCE_DATA.flatMap((property) => property.layouts.map((layout) => ({
  id: layout.layoutKey,
  subscriptionId: property.id,
  layoutKey: layout.layoutKey,
  unitKey: layout.unitKey,
  size: layout.exclusiveAreaM2,
  type: layout.type ?? "",
  image2dUrl: layout.image2dUrl,
  model2d: REVIEWED_MODELS[layout.layoutKey],
  has3d: REVIEWED_MODELS[layout.layoutKey] !== undefined,
  sourcePdf: property.sourcePdf,
  sourcePage: layout.page,
  rooms: []
})));
