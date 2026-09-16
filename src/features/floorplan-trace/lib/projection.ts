import type { PointMm, PointPx } from "@/entities/floorplan";
import type { Calibration, Projection } from "../model/types";

export function createProjection(calibration: Calibration | null): Projection | null {
  if (!calibration) return null;
  const { mmPerPx, originPx } = calibration;
  return {
    toPx: (p: PointMm): PointPx => ({ x: originPx.x + p.x / mmPerPx, y: originPx.y + p.z / mmPerPx }),
    toMm: (p: PointPx): PointMm => ({ x: (p.x - originPx.x) * mmPerPx, z: (p.y - originPx.y) * mmPerPx })
  };
}
