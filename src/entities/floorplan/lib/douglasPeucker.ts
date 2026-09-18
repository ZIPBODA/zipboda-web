import { DOUGLAS_PEUCKER_EPSILON_PX } from "../config/constants";
import type { PointPx } from "../model/types";

function perpendicularDistance(p: PointPx, a: PointPx, b: PointPx): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** 윤곽선 점열을 허용 오차 내에서 단순화한다(Douglas–Peucker) */
export function simplifyPolyline(points: PointPx[], epsilon = DOUGLAS_PEUCKER_EPSILON_PX): PointPx[] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= epsilon) return [first, last];
  const left = simplifyPolyline(points.slice(0, index + 1), epsilon);
  const right = simplifyPolyline(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}
