import { WALL_THICKNESS_M, COLLISION_PADDING_M } from "../config/constants";

/** 씬 좌표 세그먼트(미터, 중앙 원점) — 1인칭 충돌 판정 대상 */
export interface SceneSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

function closestPointOnSegment(px: number, pz: number, s: SceneSegment) {
  const dx = s.x2 - s.x1;
  const dz = s.z2 - s.z1;
  const len2 = dx * dx + dz * dz;
  if (len2 === 0) return { x: s.x1, z: s.z1 };
  let t = ((px - s.x1) * dx + (pz - s.z1) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return { x: s.x1 + t * dx, z: s.z1 + t * dz };
}

/** 벽 세그먼트로부터 padding 이내 접근을 막도록 위치를 밀어낸다(캡슐 충돌) */
export function resolveCollision(
  x: number,
  z: number,
  segs: SceneSegment[],
  padding = COLLISION_PADDING_M
): { x: number; z: number } {
  let px = x;
  let pz = z;
  const minDist = padding + WALL_THICKNESS_M / 2;
  for (const s of segs) {
    const c = closestPointOnSegment(px, pz, s);
    const dx = px - c.x;
    const dz = pz - c.z;
    const dist = Math.hypot(dx, dz);
    if (dist < minDist && dist > 1e-6) {
      const push = (minDist - dist) / dist;
      px += dx * push;
      pz += dz * push;
    }
  }
  return { x: px, z: pz };
}
