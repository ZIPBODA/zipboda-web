import {
  POINT_MERGE_TOLERANCE_MM,
  cleanOrthogonalPolygon,
  labelRoomRegions,
  polygonAreaM2,
  polygonBBox,
  polygonInteriorPoint,
  traceRegionOutline,
  type PointMm,
  type RoomRegion
} from "@/entities/floorplan";
import { MIN_ROOM_M2 } from "../config/constants";
import type { DerivedLayout, DerivedRoom, TraceWall } from "../model/types";
import { rasterizeWalls, type WallRaster } from "./rasterizeWalls";
import { isHorizontal } from "./snap";
import { openEndpoints } from "./wallOps";

const MM2_PER_M2 = 1_000_000;
const EMPTY_LAYOUT: DerivedLayout = { rooms: [], outline: [], exteriorWallIds: new Set(), openEndpoints: [] };

/**
 * 벽 중심선만으로 방·외곽·외벽을 도출한다. 방 폴리곤은 사람이 그리지 않는다.
 * 닫히지 않은 벽은 바깥과 이어져 방이 나오지 않고, 그 이유는 openEndpoints로 보인다
 */
export function deriveLayout(walls: readonly TraceWall[], options: { minRoomM2?: number } = {}): DerivedLayout {
  const raster = rasterizeWalls(walls);
  if (!raster) return EMPTY_LAYOUT;
  const { mask, mmPerPx } = raster;
  const minRoomM2 = options.minRoomM2 ?? MIN_ROOM_M2;
  const minAreaPx = (minRoomM2 * MM2_PER_M2) / (mmPerPx * mmPerPx);
  // 면적 하한은 방에만 건다 — 바깥 배경이 작아도(작은 도면) 영역으로 남아야 외벽 판정이 된다
  const { regions, owner } = labelRoomRegions(mask, 0, 0);

  const interiorIndices = new Set(regions.map((region, index) => (region.touchesBorder ? -1 : index)).filter((index) => index >= 0));
  const rooms = regions
    .filter((region) => !region.touchesBorder && region.areaPx >= minAreaPx)
    .map((region) => toRoom(region, raster))
    .filter((room) => room.polygon.length >= 3)
    .sort(byPosition)
    .map((room, index) => ({ ...room, key: `room-${index}` }));

  const isBorderRegion = (pixelIndex: number) => {
    const index = owner[pixelIndex];
    return index >= 0 && regions[index].touchesBorder;
  };
  const exteriorWallIds = new Set(walls.filter((wall) => touchesOutside(wall, raster, isBorderRegion)).map((wall) => wall.id));

  return {
    rooms,
    outline: rooms.length > 0 ? traceOutline(raster, owner, interiorIndices) : wallBBoxOutline(walls),
    exteriorWallIds,
    openEndpoints: openEndpoints(walls, POINT_MERGE_TOLERANCE_MM)
  };
}

function toRoom(region: RoomRegion, raster: WallRaster): DerivedRoom {
  const polygon = cleanOrthogonalPolygon(region.polygon.map(raster.mmOfCorner));
  return { key: "", polygon, areaM2: polygonAreaM2(polygon), labelAt: polygon.length >= 3 ? polygonInteriorPoint(polygon) : { x: 0, z: 0 } };
}

function byPosition(p: DerivedRoom, q: DerivedRoom): number {
  const a = polygonBBox(p.polygon);
  const b = polygonBBox(q.polygon);
  return a.minZ - b.minZ || a.minX - b.minX;
}

/** 벽 중점의 양옆 픽셀 중 한쪽만 바깥이면 외벽. 양쪽 다 바깥인 벽은 유닛 밖 토막이라 외벽이 아니다 */
function touchesOutside(wall: TraceWall, raster: WallRaster, isBorderRegion: (pixelIndex: number) => boolean): boolean {
  const { width, height } = raster.mask;
  const mid = raster.pxOf({ x: (wall.a.x + wall.b.x) / 2, z: (wall.a.z + wall.b.z) / 2 });
  const sides = isHorizontal(wall) ? [{ x: mid.x, y: mid.y - 1 }, { x: mid.x, y: mid.y + 1 }] : [{ x: mid.x - 1, y: mid.y }, { x: mid.x + 1, y: mid.y }];
  const outside = sides.filter((p) => 0 <= p.x && p.x < width && 0 <= p.y && p.y < height && isBorderRegion(p.y * width + p.x));
  return outside.length === 1;
}

/**
 * 실내 픽셀과 그에 8-이웃으로 닿은 벽 픽셀의 바깥 윤곽 = 벽 중심선 기준 외곽.
 * 실내에 닿지 않은 벽 조각(바깥으로 뻗은 토막)은 외곽에 들지 않는다
 */
function traceOutline(raster: WallRaster, owner: Int32Array, interiorIndices: Set<number>): PointMm[] {
  const { data, width, height } = raster.mask;
  const isInterior = (x: number, y: number) => 0 <= x && x < width && 0 <= y && y < height && interiorIndices.has(owner[y * width + x]);
  const isUnitPixel = (x: number, y: number): boolean => {
    if (!(0 <= x && x < width && 0 <= y && y < height)) return false;
    if (isInterior(x, y)) return true;
    if (data[y * width + x] !== 1) return false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx !== 0 || dy !== 0) && isInterior(x + dx, y + dy)) return true;
    return false;
  };
  return cleanOrthogonalPolygon(traceRegionOutline(isUnitPixel, 0, 0, width - 1, height - 1).map(raster.mmOfCorner));
}

function wallBBoxOutline(walls: readonly TraceWall[]): PointMm[] {
  const points = walls.flatMap((wall) => [wall.a, wall.b]);
  if (points.length === 0) return [];
  const { minX, minZ, maxX, maxZ } = polygonBBox(points);
  if (minX === maxX || minZ === maxZ) return [];
  return [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ }
  ];
}
