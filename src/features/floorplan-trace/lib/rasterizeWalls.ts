import type { MaskImage, PointMm, PointPx } from "@/entities/floorplan";
import { MAX_RASTER_CELLS, RASTER_MARGIN_PX, RASTER_MM_PER_PX } from "../config/constants";
import type { TraceWall } from "../model/types";
import { isHorizontal } from "./snap";

export interface WallRaster {
  /** 1 = 벽 중심선 */
  mask: MaskImage;
  /** 픽셀 (0,0)의 좌상단 모서리가 놓인 mm 좌표 */
  originMm: PointMm;
  mmPerPx: number;
  pxOf: (p: PointMm) => PointPx;
  mmOfCorner: (p: PointPx) => PointMm;
}

/**
 * 벽 중심선을 1px 선으로 그린 마스크. 두께는 무시한다 — 방 경계는 벽 중심선이고 면적도 중심선 기준(인쇄 전용면적 관례)이다.
 * 원점을 반 픽셀 어긋나게 잡아 격자 위 좌표가 픽셀 중심에 떨어지게 한다. 그래야 픽셀 모서리 좌표를 격자로 스냅했을 때 중심선 좌표가 정확히 나온다
 */
export function rasterizeWalls(walls: readonly Pick<TraceWall, "a" | "b">[], mmPerPx = RASTER_MM_PER_PX): WallRaster | null {
  if (walls.length === 0 || mmPerPx <= 0) return null;
  const points = walls.flatMap((wall) => [wall.a, wall.b]);
  const minX = Math.min(...points.map((p) => p.x));
  const minZ = Math.min(...points.map((p) => p.z));
  const maxX = Math.max(...points.map((p) => p.x));
  const maxZ = Math.max(...points.map((p) => p.z));
  const originMm = { x: minX - (RASTER_MARGIN_PX + 0.5) * mmPerPx, z: minZ - (RASTER_MARGIN_PX + 0.5) * mmPerPx };
  const pxOf = (p: PointMm): PointPx => ({ x: Math.floor((p.x - originMm.x) / mmPerPx), y: Math.floor((p.z - originMm.z) / mmPerPx) });
  const mmOfCorner = (p: PointPx): PointMm => ({ x: originMm.x + p.x * mmPerPx, z: originMm.z + p.y * mmPerPx });

  const farthest = pxOf({ x: maxX, z: maxZ });
  const width = farthest.x + RASTER_MARGIN_PX + 1;
  const height = farthest.y + RASTER_MARGIN_PX + 1;
  if (!Number.isFinite(width * height) || width * height > MAX_RASTER_CELLS) return null;
  const data = new Uint8Array(width * height);

  for (const wall of walls) {
    const a = pxOf(wall.a);
    const b = pxOf(wall.b);
    if (isHorizontal(wall)) {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) data[a.y * width + x] = 1;
    } else {
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) data[y * width + a.x] = 1;
    }
  }
  return { mask: { data, width, height }, originMm, mmPerPx, pxOf, mmOfCorner };
}
