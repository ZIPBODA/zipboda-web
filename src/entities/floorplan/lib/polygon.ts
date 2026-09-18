import { NORMALIZE_GRID_MM, POINT_MERGE_TOLERANCE_MM } from "../config/constants";
import type { PointMm } from "../model/types";
import { polygonBBox, snapPolygonOrthogonal } from "./normalize";

/** 점이 폴리곤 안에 있는지 본다(짝수-홀수 규칙). 경계 위의 점은 안으로 친다 */
export function pointInPolygon(point: PointMm, polygon: PointMm[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (onSegment(point, a, b)) return true;
    const crossesRay = a.z > point.z !== b.z > point.z;
    if (!crossesRay) continue;
    const xAtRay = ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x;
    if (point.x < xAtRay) inside = !inside;
  }
  return inside;
}

function onSegment(p: PointMm, a: PointMm, b: PointMm): boolean {
  const cross = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
  if (cross !== 0) return false;
  const withinX = Math.min(a.x, b.x) <= p.x && p.x <= Math.max(a.x, b.x);
  const withinZ = Math.min(a.z, b.z) <= p.z && p.z <= Math.max(a.z, b.z);
  return withinX && withinZ;
}

/**
 * 폴리곤 안에 반드시 들어가는 점.
 * 면적 무게중심은 ㄱ자 방에서 패인 자리(방 밖)에 떨어져, 방 이름이 옆방에 붙고 이름표도 남의 방에 그려진다.
 * 가로 스캔선 중 가장 넓게 뚫린 구간의 가운데를 고른다
 */
export function polygonInteriorPoint(polygon: PointMm[]): PointMm {
  const centroid = polygonCentroid(polygon);
  if (polygon.length < 3 || pointInPolygon(centroid, polygon)) return centroid;
  const levels = [...new Set(polygon.map((p) => p.z))].sort((a, b) => a - b);
  let best: { at: PointMm; width: number } | null = null;
  for (let i = 0; i + 1 < levels.length; i++) {
    const z = (levels[i] + levels[i + 1]) / 2;
    const xs = crossingsAtDepth(polygon, z);
    for (let j = 0; j + 1 < xs.length; j += 2) {
      const width = xs[j + 1] - xs[j];
      if (!best || width > best.width) best = { at: { x: (xs[j] + xs[j + 1]) / 2, z }, width };
    }
  }
  return best?.at ?? centroid;
}

/** z 높이의 가로선이 폴리곤 변과 만나는 x 좌표들(정렬). 짝수 번째부터 한 쌍씩이 내부 구간이다 */
function crossingsAtDepth(polygon: PointMm[], z: number): number[] {
  const xs: number[] = [];
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.z > z !== b.z > z) xs.push(((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x);
  }
  return xs.sort((p, q) => p - q);
}

/** 면적 가중 무게중심(shoelace). 퇴화 폴리곤은 bbox 중심으로 대체 */
export function polygonCentroid(polygon: PointMm[]): PointMm {
  let twiceArea = 0;
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i];
    const q = polygon[(i + 1) % polygon.length];
    const cross = p.x * q.z - q.x * p.z;
    twiceArea += cross;
    cx += (p.x + q.x) * cross;
    cz += (p.z + q.z) * cross;
  }
  if (twiceArea === 0) {
    const box = polygonBBox(polygon);
    return { x: (box.minX + box.maxX) / 2, z: (box.minZ + box.maxZ) / 2 };
  }
  const factor = 1 / (3 * twiceArea);
  return { x: cx * factor, z: cz * factor };
}

const isCollinear = (prev: PointMm, cur: PointMm, next: PointMm) => (cur.x - prev.x) * (next.z - cur.z) - (cur.z - prev.z) * (next.x - cur.x) === 0;
const isClose = (a: PointMm, b: PointMm, toleranceMm: number) => Math.hypot(a.x - b.x, a.z - b.z) <= toleranceMm;

/**
 * 직교 스냅 뒤 겹친 점과 직선 위의 중간점을 없앤다.
 * 래스터 윤곽 추적은 1px 벽 조각에서 폭 0 돌기(A→B→A)를 남기는데, 그대로 두면 변이 겹쳐
 * "교차하지 않는 직교 폴리곤" 검사에 걸리고 3D 바닥도 찢어진다. B는 직선 위 점으로, A·A는 겹침으로 사라진다
 */
export function cleanOrthogonalPolygon(polygon: PointMm[], gridMm = NORMALIZE_GRID_MM, toleranceMm = POINT_MERGE_TOLERANCE_MM): PointMm[] {
  let points = snapPolygonOrthogonal(polygon, gridMm);
  let changed = true;
  while (changed && points.length >= 3) {
    changed = false;
    const kept: PointMm[] = [];
    for (let i = 0; i < points.length; i++) {
      const prev = points[(i - 1 + points.length) % points.length];
      const cur = points[i];
      const next = points[(i + 1) % points.length];
      if (isClose(prev, cur, toleranceMm) || isCollinear(prev, cur, next)) {
        changed = true;
        continue;
      }
      kept.push(cur);
    }
    points = kept;
  }
  return points.length >= 3 ? points : [];
}
