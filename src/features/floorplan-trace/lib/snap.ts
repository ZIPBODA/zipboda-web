import { NORMALIZE_GRID_MM, snapToGrid, type PointMm } from "@/entities/floorplan";
import { BOUNDARY_THICKNESS_MM } from "../config/constants";
import type { TraceWall } from "../model/types";

const distance = (a: PointMm, b: PointMm) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * 점을 기존 벽 끝점 → 끝점의 축선 → 격자 순으로 붙인다.
 * 끝점에 붙어야 벽이 이어지고, 축선에 붙어야 마주보는 벽이 한 줄에 놓인다
 */
export function snapPoint(p: PointMm, walls: readonly TraceWall[], toleranceMm: number, gridMm = NORMALIZE_GRID_MM): PointMm {
  const endpoints = walls.flatMap((wall) => [wall.a, wall.b]);
  let nearest: PointMm | null = null;
  let nearestDistance = toleranceMm;
  for (const endpoint of endpoints) {
    const d = distance(p, endpoint);
    if (d <= nearestDistance) {
      nearest = endpoint;
      nearestDistance = d;
    }
  }
  if (nearest) return { ...nearest };

  const axisX = endpoints.find((endpoint) => Math.abs(endpoint.x - p.x) <= toleranceMm)?.x;
  const axisZ = endpoints.find((endpoint) => Math.abs(endpoint.z - p.z) <= toleranceMm)?.z;
  return { x: axisX ?? snapToGrid(p.x, gridMm), z: axisZ ?? snapToGrid(p.z, gridMm) };
}

/** 변위가 큰 축만 남겨 수평/수직 벽을 만든다 */
export function orthogonalize(p: PointMm, from: PointMm): PointMm {
  const dx = Math.abs(p.x - from.x);
  const dz = Math.abs(p.z - from.z);
  return dz <= dx ? { x: p.x, z: from.z } : { x: from.x, z: p.z };
}

export const isHorizontal = (wall: Pick<TraceWall, "a" | "b">): boolean => wall.a.z === wall.b.z;

export const isBoundary = (wall: Pick<TraceWall, "thicknessMm">): boolean => wall.thicknessMm === BOUNDARY_THICKNESS_MM;

/** a ≤ b(x 우선, 같으면 z)로 정렬한다. 개구부 offset은 a 기준이므로 뒤집혔으면 호출 측이 offset도 뒤집어야 한다 */
export function orientWall<T extends Pick<TraceWall, "a" | "b">>(wall: T): T {
  const aFirst = wall.a.x < wall.b.x || (wall.a.x === wall.b.x && wall.a.z <= wall.b.z);
  return aFirst ? wall : { ...wall, a: wall.b, b: wall.a };
}

export const isOriented = (wall: Pick<TraceWall, "a" | "b">): boolean => orientWall(wall) === wall;

export const snapPointToGrid = (p: PointMm, gridMm = NORMALIZE_GRID_MM): PointMm => ({ x: snapToGrid(p.x, gridMm), z: snapToGrid(p.z, gridMm) });
