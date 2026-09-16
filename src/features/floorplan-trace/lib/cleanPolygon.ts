import { NORMALIZE_GRID_MM, POINT_MERGE_TOLERANCE_MM, snapPolygonOrthogonal, type PointMm } from "@/entities/floorplan";

const isCollinear = (prev: PointMm, cur: PointMm, next: PointMm) => (cur.x - prev.x) * (next.z - cur.z) - (cur.z - prev.z) * (next.x - cur.x) === 0;
const isClose = (a: PointMm, b: PointMm, toleranceMm: number) => Math.hypot(a.x - b.x, a.z - b.z) <= toleranceMm;

/**
 * 래스터 윤곽을 격자에 스냅한 뒤 겹친 점과 직선 위의 중간점을 없앤다.
 * 1px 벽 조각이 만든 폭 0 돌기(A→B→A)는 B가 직선 위 점으로 사라지고 A·A가 겹쳐 지워진다
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
