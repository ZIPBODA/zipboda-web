import { POINT_MERGE_TOLERANCE_MM, type Opening2D, type PointMm, type Wall2D } from "@/entities/floorplan";
import type { TraceOpening, TraceWall } from "../model/types";
import { isHorizontal, orientWall } from "./snap";

type Segment = Pick<TraceWall, "a" | "b">;

export const wallLengthMm = (wall: Segment): number => Math.hypot(wall.b.x - wall.a.x, wall.b.z - wall.a.z);

/** a에서 along(mm)만큼 간 점 */
export function pointOnWall(wall: Segment, alongMm: number): PointMm {
  const length = wallLengthMm(wall);
  if (length === 0) return { ...wall.a };
  const t = alongMm / length;
  return { x: wall.a.x + (wall.b.x - wall.a.x) * t, z: wall.a.z + (wall.b.z - wall.a.z) * t };
}

/** 점을 벽 축선에 투영한 a로부터의 거리. 벽 밖이면 음수 또는 길이 초과 */
export function alongWall(wall: Segment, p: PointMm): number {
  const length = wallLengthMm(wall);
  if (length === 0) return 0;
  return ((p.x - wall.a.x) * (wall.b.x - wall.a.x) + (p.z - wall.a.z) * (wall.b.z - wall.a.z)) / length;
}

/** alongWall을 벽 길이 안으로 자른 값 */
export function projectOntoWall(wall: Segment, p: PointMm): number {
  return Math.max(0, Math.min(wallLengthMm(wall), alongWall(wall, p)));
}

export function distanceToWall(wall: Segment, p: PointMm): number {
  const foot = pointOnWall(wall, projectOntoWall(wall, p));
  return Math.hypot(p.x - foot.x, p.z - foot.z);
}

export function nearestWall(walls: readonly TraceWall[], p: PointMm, toleranceMm: number): { wall: TraceWall; distanceMm: number } | null {
  let best: { wall: TraceWall; distanceMm: number } | null = null;
  for (const wall of walls) {
    const distanceMm = distanceToWall(wall, p);
    if (distanceMm <= toleranceMm && (!best || distanceMm < best.distanceMm)) best = { wall, distanceMm };
  }
  return best;
}

const freeAxis = (wall: Segment): "x" | "z" => (isHorizontal(wall) ? "x" : "z");
const otherAxis = (axis: "x" | "z"): "x" | "z" => (axis === "x" ? "z" : "x");
const span = (wall: Segment, axis: "x" | "z") => ({ min: Math.min(wall.a[axis], wall.b[axis]), max: Math.max(wall.a[axis], wall.b[axis]) });

/**
 * 다른 벽에 조금 못 미치거나 살짝 지나친 끝점을 그 벽 위로 옮긴다(자기 축 방향으로만 움직여 수평/수직을 유지).
 * 격자 스냅 뒤 남은 몇 십 mm 틈으로 방이 새는 것을 막는다
 */
export function healWallEndpoints(walls: readonly TraceWall[], toleranceMm: number): TraceWall[] {
  return walls.map((wall) => {
    const axis = freeAxis(wall);
    const cross = otherAxis(axis);
    const healed = { ...wall, a: { ...wall.a }, b: { ...wall.b } };
    for (const end of ["a", "b"] as const) {
      const point = healed[end];
      let target = point[axis];
      let bestDistance = toleranceMm;
      for (const other of walls) {
        if (other === wall) continue;
        const candidates: number[] = [];
        if (freeAxis(other) === cross) {
          // 직교하는 벽의 축선: 그 벽의 구간 안(허용치 포함)에 있을 때만
          const { min, max } = span(other, cross);
          if (min - toleranceMm <= point[cross] && point[cross] <= max + toleranceMm) candidates.push(other.a[axis]);
        }
        for (const endpoint of [other.a, other.b]) {
          if (Math.abs(endpoint[cross] - point[cross]) <= toleranceMm) candidates.push(endpoint[axis]);
        }
        for (const candidate of candidates) {
          const d = Math.abs(candidate - point[axis]);
          if (d > 0 && d <= bestDistance) {
            bestDistance = d;
            target = candidate;
          }
        }
      }
      point[axis] = target;
    }
    return orientWall(healed);
  });
}

/** 다른 벽 어디에도 닿지 않은 끝점들 */
export function openEndpoints(walls: readonly TraceWall[], toleranceMm = POINT_MERGE_TOLERANCE_MM): PointMm[] {
  const open: PointMm[] = [];
  for (const wall of walls) {
    for (const point of [wall.a, wall.b]) {
      const touches = walls.some((other) => other !== wall && distanceToWall(other, point) <= toleranceMm);
      if (!touches) open.push(point);
    }
  }
  return open;
}

/**
 * 벽이 움직인 뒤에도 개구부가 도면 위 같은 자리에 남게 한다.
 * 개구부 중심을 새 벽에 다시 투영하고, 벽 밖으로 벗어난 개구부는 버린다
 */
export function reprojectOpenings(openings: readonly TraceOpening[], before: TraceWall, after: TraceWall): TraceOpening[] {
  const afterLength = wallLengthMm(after);
  return openings.flatMap((opening) => {
    if (opening.wallId !== before.id) return [opening];
    const center = pointOnWall(before, opening.offsetMm + opening.widthMm / 2);
    const offsetMm = Math.round(alongWall(after, center) - opening.widthMm / 2);
    const fits = 0 <= offsetMm && offsetMm + opening.widthMm <= afterLength;
    return fits ? [{ ...opening, wallId: after.id, offsetMm }] : [];
  });
}

interface Interval {
  wall: Wall2D;
  start: number;
  end: number;
}

/**
 * 같은 축선 위에서 맞닿거나 겹치는 벽을 하나로 합치고, 합쳐진 벽에 얹힌 개구부의 offset을 새 시작점 기준으로 옮긴다.
 * normalizeModel의 병합은 첫 벽 id만 남겨 나머지 벽의 개구부 참조가 끊기므로, 여기서 먼저 합쳐 준다
 */
export function mergeWallsRemapOpenings(
  walls: readonly Wall2D[],
  openings: readonly TraceOpening[],
  toleranceMm = POINT_MERGE_TOLERANCE_MM
): { walls: Wall2D[]; openings: Opening2D[] } {
  const groups = new Map<string, Interval[]>();
  for (const wall of walls) {
    const horizontal = isHorizontal(wall);
    const along = horizontal ? "x" : "z";
    const line = horizontal ? wall.a.z : wall.a.x;
    const key = `${horizontal ? "h" : "v"}:${line}`;
    const interval = { wall, start: Math.min(wall.a[along], wall.b[along]), end: Math.max(wall.a[along], wall.b[along]) };
    groups.set(key, [...(groups.get(key) ?? []), interval]);
  }

  const mergedWalls: Wall2D[] = [];
  const remap = new Map<string, { wallId: string; shiftMm: number }>();
  for (const [key, group] of groups) {
    const horizontal = key.startsWith("h");
    const sorted = [...group].sort((p, q) => p.start - q.start);
    let current = sorted[0];
    const flush = () => mergedWalls.push(toWall(current, horizontal));
    remap.set(current.wall.id, { wallId: current.wall.id, shiftMm: 0 });
    for (const next of sorted.slice(1)) {
      if (next.start <= current.end + toleranceMm) {
        remap.set(next.wall.id, { wallId: current.wall.id, shiftMm: next.start - current.start });
        current = {
          wall: { ...current.wall, thicknessMm: Math.max(current.wall.thicknessMm, next.wall.thicknessMm), exterior: current.wall.exterior || next.wall.exterior },
          start: current.start,
          end: Math.max(current.end, next.end)
        };
      } else {
        flush();
        current = next;
        remap.set(current.wall.id, { wallId: current.wall.id, shiftMm: 0 });
      }
    }
    flush();
  }

  const lengthById = new Map(mergedWalls.map((wall) => [wall.id, wallLengthMm(wall)]));
  const remapped: Opening2D[] = openings.flatMap(({ id: _id, ...opening }) => {
    const target = remap.get(opening.wallId);
    if (!target) return [];
    const offsetMm = opening.offsetMm + target.shiftMm;
    const length = lengthById.get(target.wallId) ?? 0;
    const fits = 0 <= offsetMm && offsetMm + opening.widthMm <= length;
    return fits ? [{ ...opening, wallId: target.wallId, offsetMm }] : [];
  });
  return { walls: mergedWalls, openings: remapped };
}

function toWall(interval: Interval, horizontal: boolean): Wall2D {
  const fixed = horizontal ? interval.wall.a.z : interval.wall.a.x;
  return {
    ...interval.wall,
    a: horizontal ? { x: interval.start, z: fixed } : { x: fixed, z: interval.start },
    b: horizontal ? { x: interval.end, z: fixed } : { x: fixed, z: interval.end }
  };
}
