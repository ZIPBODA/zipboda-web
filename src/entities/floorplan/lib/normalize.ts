import {
  AREA_EXCLUDED_LABELS,
  AREA_TOLERANCE,
  AUTO_ACCEPT_CONFIDENCE,
  CONFIDENCE_PENALTY,
  DOOR_ADJACENCY_TOLERANCE_MM,
  ENTRANCE_LABEL,
  NORMALIZE_GRID_MM,
  OPEN_PASSAGE_MIN_MM,
  OPENING_LENGTH_TOLERANCE_MM,
  POINT_MERGE_TOLERANCE_MM,
  SCALE_TOLERANCE,
  TILING_MAX_COVERAGE,
  TILING_MIN_COVERAGE,
  TILING_OVERLAP_TOLERANCE_MM2
} from "../config/constants";
import type { FloorplanModel2D, NormalizeFlag, NormalizeResult, PointMm, Room2D, Wall2D } from "../model/types";

const MM2_PER_M2 = 1_000_000;

export interface BBox {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export const snapToGrid = (value: number, gridMm = NORMALIZE_GRID_MM): number => Math.round(value / gridMm) * gridMm;

const distance = (a: PointMm, b: PointMm) => Math.hypot(b.x - a.x, b.z - a.z);

export function dedupePolygon(polygon: PointMm[], toleranceMm = POINT_MERGE_TOLERANCE_MM): PointMm[] {
  const out: PointMm[] = [];
  for (const p of polygon) {
    const last = out[out.length - 1];
    if (!last || distance(last, p) > toleranceMm) out.push(p);
  }
  if (out.length > 1 && distance(out[0], out[out.length - 1]) <= toleranceMm) out.pop();
  return out;
}

/** 각 변을 수평/수직으로 강제하고 그리드에 스냅한다(직교 레이아웃 전제) */
export function snapPolygonOrthogonal(polygon: PointMm[], gridMm = NORMALIZE_GRID_MM): PointMm[] {
  const pts = polygon.map((p) => ({ x: snapToGrid(p.x, gridMm), z: snapToGrid(p.z, gridMm) }));
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const isHorizontalEdge = Math.abs(cur.x - prev.x) >= Math.abs(cur.z - prev.z);
    if (isHorizontalEdge) cur.z = prev.z;
    else cur.x = prev.x;
  }
  return dedupePolygon(pts);
}

export function polygonAreaMm2(polygon: PointMm[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a.x * b.z - b.x * a.z;
  }
  return Math.abs(sum) / 2;
}

export const polygonAreaM2 = (polygon: PointMm[]): number => polygonAreaMm2(polygon) / MM2_PER_M2;

export function polygonBBox(polygon: PointMm[]): BBox {
  const xs = polygon.map((p) => p.x);
  const zs = polygon.map((p) => p.z);
  return { minX: Math.min(...xs), minZ: Math.min(...zs), maxX: Math.max(...xs), maxZ: Math.max(...zs) };
}

export const wallLength = (wall: Wall2D): number => distance(wall.a, wall.b);

const roomArea = (room: Room2D) => room.areaM2 ?? polygonAreaM2(room.polygon);
const isAreaCounted = (room: Room2D) => !AREA_EXCLUDED_LABELS.includes(room.label);

export function validateScale(model: FloorplanModel2D): NormalizeFlag[] {
  if (model.printed.dimensionChains.length === 0) {
    return [{ code: "scale-no-chain", detail: "치수 체인 없음" }];
  }
  const box = polygonBBox(model.outline);
  const extent = { x: box.maxX - box.minX, z: box.maxZ - box.minZ };
  const flags: NormalizeFlag[] = [];
  for (const chain of model.printed.dimensionChains) {
    const sum = chain.values.reduce((a, b) => a + b, 0);
    const deviation = Math.abs(sum - extent[chain.axis]) / extent[chain.axis];
    if (deviation > SCALE_TOLERANCE) {
      flags.push({ code: "scale-mismatch", detail: `${chain.axis} 체인 합 ${sum} vs 외곽 ${extent[chain.axis]}` });
    }
  }
  return flags;
}

export function validateArea(model: FloorplanModel2D): NormalizeFlag[] {
  const printed = model.printed.exclusiveAreaM2;
  if (printed === undefined) return [];
  const sum = model.rooms.filter(isAreaCounted).reduce((acc, r) => acc + roomArea(r), 0);
  const deviation = Math.abs(sum - printed) / printed;
  return deviation > AREA_TOLERANCE ? [{ code: "area-mismatch", detail: `방 합 ${sum.toFixed(2)}㎡ vs 전용 ${printed}㎡` }] : [];
}

/** 직교 폴리곤이 x 구간(midX 기준)에서 덮는 z 구간들 — 수평 변과의 교차 z를 정렬해 짝지음 */
function verticalCoverageAt(polygon: PointMm[], midX: number): [number, number][] {
  const crossings: number[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const isHorizontalEdge = Math.abs(a.z - b.z) <= POINT_MERGE_TOLERANCE_MM;
    const spansMid = Math.min(a.x, b.x) < midX && midX < Math.max(a.x, b.x);
    if (isHorizontalEdge && spansMid) crossings.push(a.z);
  }
  crossings.sort((p, q) => p - q);
  const intervals: [number, number][] = [];
  for (let i = 0; i + 1 < crossings.length; i += 2) intervals.push([crossings[i], crossings[i + 1]]);
  return intervals;
}

const overlapLength = (p: [number, number], q: [number, number]) => Math.max(0, Math.min(p[1], q[1]) - Math.max(p[0], q[0]));

/** 두 직교 폴리곤의 정확한 교차 면적 — bbox 판정은 L자 방을 겹침으로 오탐한다 */
export function rectilinearIntersectionArea(a: PointMm[], b: PointMm[]): number {
  const xs = Array.from(new Set([...a, ...b].map((p) => p.x))).sort((p, q) => p - q);
  let area = 0;
  for (let i = 0; i + 1 < xs.length; i++) {
    const width = xs[i + 1] - xs[i];
    if (width <= 0) continue;
    const midX = (xs[i] + xs[i + 1]) / 2;
    const covA = verticalCoverageAt(a, midX);
    const covB = verticalCoverageAt(b, midX);
    for (const p of covA) for (const q of covB) area += overlapLength(p, q) * width;
  }
  return area;
}

export function validateTiling(model: FloorplanModel2D): NormalizeFlag[] {
  const flags: NormalizeFlag[] = [];
  const outlineArea = polygonAreaMm2(model.outline);
  if (outlineArea === 0) return [{ code: "tiling-gap", detail: "외곽 면적 0" }];
  const coverage = model.rooms.reduce((acc, r) => acc + polygonAreaMm2(r.polygon), 0) / outlineArea;
  const isCoverageOutOfRange = coverage < TILING_MIN_COVERAGE || coverage > TILING_MAX_COVERAGE;
  if (isCoverageOutOfRange) flags.push({ code: "tiling-gap", detail: `방 면적 커버리지 ${(coverage * 100).toFixed(1)}%` });

  for (let i = 0; i < model.rooms.length; i++) {
    for (let j = i + 1; j < model.rooms.length; j++) {
      if (rectilinearIntersectionArea(model.rooms[i].polygon, model.rooms[j].polygon) > TILING_OVERLAP_TOLERANCE_MM2) {
        flags.push({ code: "tiling-overlap", detail: `${model.rooms[i].id}·${model.rooms[j].id} 겹침` });
      }
    }
  }
  return flags;
}

const isHorizontal = (wall: Wall2D) => Math.abs(wall.a.z - wall.b.z) <= POINT_MERGE_TOLERANCE_MM;

/** 같은 축선 위에서 겹치거나 맞닿는 벽을 하나로 합친다 */
export function mergeCollinearWalls(walls: Wall2D[], toleranceMm = POINT_MERGE_TOLERANCE_MM): Wall2D[] {
  const groups = new Map<string, Wall2D[]>();
  for (const wall of walls) {
    const horizontal = isHorizontal(wall);
    const line = snapToGrid(horizontal ? wall.a.z : wall.a.x);
    const key = `${horizontal ? "h" : "v"}:${line}`;
    groups.set(key, [...(groups.get(key) ?? []), wall]);
  }

  const merged: Wall2D[] = [];
  for (const [key, group] of groups) {
    const horizontal = key.startsWith("h");
    const along = (p: PointMm) => (horizontal ? p.x : p.z);
    const intervals = group
      .map((w) => ({ w, start: Math.min(along(w.a), along(w.b)), end: Math.max(along(w.a), along(w.b)) }))
      .sort((p, q) => p.start - q.start);

    let cur = intervals[0];
    for (const next of intervals.slice(1)) {
      const isTouching = next.start <= cur.end + toleranceMm;
      if (isTouching) {
        cur = {
          w: { ...cur.w, thicknessMm: Math.max(cur.w.thicknessMm, next.w.thicknessMm), exterior: cur.w.exterior || next.w.exterior },
          start: cur.start,
          end: Math.max(cur.end, next.end)
        };
      } else {
        merged.push(toWall(cur, horizontal));
        cur = next;
      }
    }
    merged.push(toWall(cur, horizontal));
  }
  return merged;
}

function toWall(interval: { w: Wall2D; start: number; end: number }, horizontal: boolean): Wall2D {
  const fixed = horizontal ? interval.w.a.z : interval.w.a.x;
  return {
    ...interval.w,
    a: horizontal ? { x: interval.start, z: fixed } : { x: fixed, z: interval.start },
    b: horizontal ? { x: interval.end, z: fixed } : { x: fixed, z: interval.end }
  };
}

export function validateOpenings(model: FloorplanModel2D): NormalizeFlag[] {
  const wallsById = new Map(model.walls.map((w) => [w.id, w]));
  const flags: NormalizeFlag[] = [];
  for (const opening of model.openings) {
    const wall = wallsById.get(opening.wallId);
    if (!wall) {
      flags.push({ code: "opening-invalid", detail: `${opening.wallId} 벽 없음` });
      continue;
    }
    const isOutsideWall = opening.offsetMm < 0 || opening.offsetMm + opening.widthMm > wallLength(wall) + OPENING_LENGTH_TOLERANCE_MM;
    if (isOutsideWall) flags.push({ code: "opening-invalid", detail: `${opening.wallId} 개구부가 벽 길이 초과` });
  }
  return flags;
}

const pointOnWall = (wall: Wall2D, alongMm: number): PointMm => {
  const len = wallLength(wall);
  const t = len === 0 ? 0 : alongMm / len;
  return { x: wall.a.x + (wall.b.x - wall.a.x) * t, z: wall.a.z + (wall.b.z - wall.a.z) * t };
};

const bboxContains = (box: BBox, p: PointMm, pad: number) =>
  box.minX - pad <= p.x && p.x <= box.maxX + pad && box.minZ - pad <= p.z && p.z <= box.maxZ + pad;

interface AxisEdge {
  horizontal: boolean;
  line: number;
  start: number;
  end: number;
}

function polygonAxisEdges(polygon: PointMm[]): AxisEdge[] {
  const edges: AxisEdge[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const horizontal = Math.abs(a.z - b.z) <= POINT_MERGE_TOLERANCE_MM;
    const vertical = Math.abs(a.x - b.x) <= POINT_MERGE_TOLERANCE_MM;
    if (!horizontal && !vertical) continue;
    const along = horizontal ? [a.x, b.x] : [a.z, b.z];
    edges.push({ horizontal, line: horizontal ? a.z : a.x, start: Math.min(...along), end: Math.max(...along) });
  }
  return edges;
}

const wallAxisEdge = (wall: Wall2D): AxisEdge => {
  const horizontal = isHorizontal(wall);
  const along = horizontal ? [wall.a.x, wall.b.x] : [wall.a.z, wall.b.z];
  return { horizontal, line: horizontal ? wall.a.z : wall.a.x, start: Math.min(...along), end: Math.max(...along) };
};

const onSameLine = (p: AxisEdge, q: AxisEdge) => p.horizontal === q.horizontal && Math.abs(p.line - q.line) <= POINT_MERGE_TOLERANCE_MM;

/** [start,end]에서 blockers 구간을 뺀 나머지 중 가장 긴 길이 */
function longestUncovered(start: number, end: number, blockers: AxisEdge[]): number {
  const sorted = blockers
    .map((b) => ({ start: Math.max(start, b.start), end: Math.min(end, b.end) }))
    .filter((b) => b.end > b.start)
    .sort((p, q) => p.start - q.start);
  let longest = 0;
  let cursor = start;
  for (const b of sorted) {
    longest = Math.max(longest, b.start - cursor);
    cursor = Math.max(cursor, b.end);
  }
  return Math.max(longest, end - cursor);
}

/** 두 방이 벽 없이 맞닿은 개방 경계(현관↔주방·주방↔거실 오픈 플랜)를 갖는지 — 문 없이도 통행 가능 */
function hasOpenPassage(a: Room2D, b: Room2D, walls: AxisEdge[]): boolean {
  for (const ea of polygonAxisEdges(a.polygon)) {
    for (const eb of polygonAxisEdges(b.polygon)) {
      if (!onSameLine(ea, eb)) continue;
      const start = Math.max(ea.start, eb.start);
      const end = Math.min(ea.end, eb.end);
      if (end - start < OPEN_PASSAGE_MIN_MM) continue;
      const blockers = walls.filter((w) => onSameLine(w, ea));
      if (longestUncovered(start, end, blockers) >= OPEN_PASSAGE_MIN_MM) return true;
    }
  }
  return false;
}

/** 문 그래프(+벽 없는 개방 경계)로 현관에서 모든 방(발코니 제외)에 도달 가능한지 검사한다 */
export function checkReachability(model: FloorplanModel2D): NormalizeFlag[] {
  const doors = model.openings.filter((o) => o.type === "door");
  if (doors.length === 0) return [{ code: "no-doors", detail: "문 미검출" }];

  const wallsById = new Map(model.walls.map((w) => [w.id, w]));
  const boxes = model.rooms.map((r) => ({ room: r, box: polygonBBox(r.polygon) }));
  const adjacency = new Map<string, Set<string>>(model.rooms.map((r) => [r.id, new Set<string>()]));
  const connect = (a: string, b: string) => {
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  };

  for (const door of doors) {
    const wall = wallsById.get(door.wallId);
    if (!wall) continue;
    const center = pointOnWall(wall, door.offsetMm + door.widthMm / 2);
    const pad = wall.thicknessMm + DOOR_ADJACENCY_TOLERANCE_MM;
    const touching = boxes.filter(({ box }) => bboxContains(box, center, pad)).map(({ room }) => room.id);
    for (const a of touching) for (const b of touching) if (a !== b) connect(a, b);
  }

  const wallEdges = model.walls.map(wallAxisEdge);
  for (let i = 0; i < model.rooms.length; i++) {
    for (let j = i + 1; j < model.rooms.length; j++) {
      if (hasOpenPassage(model.rooms[i], model.rooms[j], wallEdges)) connect(model.rooms[i].id, model.rooms[j].id);
    }
  }

  const entrance = model.rooms.find((r) => r.label === ENTRANCE_LABEL) ?? model.rooms[0];
  if (!entrance) return [];
  const visited = new Set<string>([entrance.id]);
  const queue = [entrance.id];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === undefined) break;
    for (const next of adjacency.get(cur) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return model.rooms
    .filter((r) => isAreaCounted(r) && !visited.has(r.id))
    .map((r) => ({ code: "unreachable-room" as const, detail: `${r.label}(${r.id}) 도달 불가` }));
}

export function computeConfidence(flags: NormalizeFlag[]): number {
  const penalty = flags.reduce((acc, f) => acc + CONFIDENCE_PENALTY[f.code], 0);
  return Math.max(0, Math.min(1, 1 - penalty));
}

/** 추출 모델을 직교 스냅·벽 병합 후 검증해 신뢰도와 자동 확정 여부를 산출한다 */
export function normalizeModel(model: FloorplanModel2D): NormalizeResult {
  const snapPoint = (p: PointMm): PointMm => ({ x: snapToGrid(p.x), z: snapToGrid(p.z) });
  const normalized: FloorplanModel2D = {
    ...model,
    outline: snapPolygonOrthogonal(model.outline),
    rooms: model.rooms.map((r) => ({ ...r, polygon: snapPolygonOrthogonal(r.polygon) })),
    walls: mergeCollinearWalls(model.walls.map((w) => ({ ...w, a: snapPoint(w.a), b: snapPoint(w.b) })))
  };

  const flags = [
    ...validateScale(normalized),
    ...validateArea(normalized),
    ...validateTiling(normalized),
    ...validateOpenings(normalized),
    ...checkReachability(normalized)
  ];
  const confidence = computeConfidence(flags);

  return {
    model: { ...normalized, confidence: { ...normalized.confidence, overall: confidence } },
    confidence,
    flags,
    autoAccept: confidence >= AUTO_ACCEPT_CONFIDENCE
  };
}
