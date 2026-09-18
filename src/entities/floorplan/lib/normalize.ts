import { validateModelIntegrity } from "./modelIntegrity";
import { cleanOrthogonalPolygon, pointInPolygon } from "./polygon";
import {
  AREA_EXCLUDED_LABELS,
  REACHABILITY_EXEMPT_LABELS,
  REACHABILITY_EXEMPT_UNLABELED_MAX_M2,
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

// `|| 0`은 -0을 0으로 — 음수 좌표를 반올림하면 -0이 나와 좌표 비교가 어긋난다
export const snapToGrid = (value: number, gridMm = NORMALIZE_GRID_MM): number => Math.round(value / gridMm) * gridMm || 0;

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

const roomArea = (room: Room2D) => polygonAreaM2(room.polygon);
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

/**
 * 방 면적 합과 인쇄 전용면적을 견준다.
 *
 * 전용면적은 발코니를 뺀 값이라, 발코니를 알아봐야 같은 기준으로 비교할 수 있다.
 * 그런데 방 이름이 인쇄되지 않은 도면도 있고, 작은 글씨라 OCR이 놓치기도 한다.
 * 그럴 때 합계에는 발코니가 섞여 들어가므로 "많다"는 이유로 걸면 거짓 경고가 된다.
 * 그래서 제외 대상 이름을 하나도 못 읽었으면 "모자란다"만 본다.
 * 넘치는 쪽은 tiling 검사(커버리지 상한·겹침)가 이미 잡는다.
 */
export interface ExclusiveAreaBounds {
  /** 면적에 세는 방(발코니 제외) 폴리곤 합 — 벽 중심선 기준 */
  centerline: number;
  /** 중심선 합에서 외벽 안쪽 반두께 띠를 뺀 값 — 안목치수 기준에 가깝다 */
  innerFace: number;
}

const wallSideProbe = (wall: Wall2D, sign: 1 | -1): PointMm => {
  const dx = wall.b.x - wall.a.x;
  const dz = wall.b.z - wall.a.z;
  const length = Math.hypot(dx, dz) || 1;
  const offset = wall.thicknessMm / 2 + 1;
  return { x: (wall.a.x + wall.b.x) / 2 + (-dz / length) * offset * sign, z: (wall.a.z + wall.b.z) / 2 + (dx / length) * offset * sign };
};

/**
 * 전용면적 산정 기준은 도면마다 벽 중심선(단독·다가구)이거나 안목치수(공동주택)라 두 환산값을 함께 돌려준다.
 * 안목 환산에서는 면적에 세는 방에 면한 외벽만 뺀다 — 발코니에만 면한 외벽은 발코니 몫이다
 */
export function exclusiveAreaBounds(model: FloorplanModel2D): ExclusiveAreaBounds {
  const counted = model.rooms.filter(isAreaCounted);
  const centerline = counted.reduce((acc, r) => acc + roomArea(r), 0);
  const facesCountedRoom = (wall: Wall2D) =>
    ([1, -1] as const).some((sign) => counted.some((room) => pointInPolygon(wallSideProbe(wall, sign), room.polygon)));
  const band = model.walls
    .filter((wall) => wall.exterior && facesCountedRoom(wall))
    .reduce((acc, wall) => acc + (wallLength(wall) * wall.thicknessMm) / 2, 0);
  return { centerline, innerFace: centerline - band / MM2_PER_M2 };
}

/** 인쇄 전용면적이 [안목 환산, 중심선 합] 구간을 벗어난 비율. 구간 안이면 0, 전용면적이 없으면 null */
export function exclusiveAreaDeviation(model: FloorplanModel2D): number | null {
  const printed = model.printed.exclusiveAreaM2;
  if (printed === undefined) return null;
  const { centerline, innerFace } = exclusiveAreaBounds(model);
  const knowsExcludedRooms = model.rooms.some((room) => !isAreaCounted(room));
  // 방 합이 전용면적에 못 미치면 방을 놓친 것이다
  if (printed > centerline) return (printed - centerline) / printed;
  // 방 합이 안목 환산으로도 전용면적을 넘으면 방을 더 잡은 것이다 — 단, 발코니를 못 읽었으면 발코니가 섞인 것일 수 있어 걸지 않는다
  if (knowsExcludedRooms && printed < innerFace) return (innerFace - printed) / printed;
  return 0;
}

export function validateArea(model: FloorplanModel2D): NormalizeFlag[] {
  const printed = model.printed.exclusiveAreaM2;
  if (printed === undefined) return [];
  const deviation = exclusiveAreaDeviation(model);
  if (deviation === null || deviation <= AREA_TOLERANCE) return [];

  const { centerline, innerFace } = exclusiveAreaBounds(model);
  const knowsExcludedRooms = model.rooms.some((room) => !isAreaCounted(room));
  const basis = knowsExcludedRooms ? "" : " (발코니 등 제외 대상을 못 읽어 부족분만 검사)";
  return [{ code: "area-mismatch", detail: `방 합 ${centerline.toFixed(2)}㎡·안목 환산 ${innerFace.toFixed(2)}㎡ vs 전용 ${printed}㎡${basis}` }];
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

  for (const room of model.rooms) {
    if (polygonAreaMm2(room.polygon) - rectilinearIntersectionArea(room.polygon, model.outline) > 1) flags.push({ code: "room-outside", detail: room.id });
  }
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
    const isOutsideWall = !Number.isFinite(opening.offsetMm) || !Number.isFinite(opening.widthMm) || opening.widthMm <= 0 || opening.offsetMm < 0 || opening.offsetMm + opening.widthMm > wallLength(wall) + OPENING_LENGTH_TOLERANCE_MM;
    if (isOutsideWall) flags.push({ code: "opening-invalid", detail: `${opening.wallId} 개구부가 벽 길이 초과` });
  }
  for (let i = 0; i < model.openings.length; i++) {
    const a = model.openings[i];
    for (const b of model.openings.slice(i + 1)) {
      if (a.wallId === b.wallId && Math.max(a.offsetMm, b.offsetMm) < Math.min(a.offsetMm + a.widthMm, b.offsetMm + b.widthMm)) flags.push({ code: "opening-invalid", detail: `${a.wallId}: overlapping openings` });
    }
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

  // 현관을 못 읽었으면 가장 넓은 방에서 출발한다. 첫 번째 방은 구석 조각일 수 있어 기준이 되지 못한다
  const largest = model.rooms.reduce<Room2D | null>(
    (best, room) => (best === null || polygonAreaMm2(room.polygon) > polygonAreaMm2(best.polygon) ? room : best),
    null
  );
  const entrance = model.rooms.find((r) => r.label === ENTRANCE_LABEL) ?? largest;
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
    .filter((r) => isAreaCounted(r) && needsReachability(r) && !visited.has(r.id))
    .map((r) => ({ code: "unreachable-room" as const, detail: `${r.label}(${r.id}) 도달 불가` }));
}

/** 수납·설비 공간은 사람이 드나드는 문이 없어도 정상이다 */
function needsReachability(room: Room2D): boolean {
  if (REACHABILITY_EXEMPT_LABELS.includes(room.label)) return false;
  const isSmallUnlabeled = room.label === "기타" && polygonAreaMm2(room.polygon) / 1_000_000 <= REACHABILITY_EXEMPT_UNLABELED_MAX_M2;
  return !isSmallUnlabeled;
}

export function computeConfidence(flags: NormalizeFlag[]): number {
  const penalty = flags.reduce((acc, f) => acc + CONFIDENCE_PENALTY[f.code], 0);
  return Math.max(0, Math.min(1, 1 - penalty));
}

/** 추출 모델을 직교 스냅·벽 병합 후 검증해 신뢰도와 자동 확정 여부를 산출한다 */
export function normalizeModel(model: FloorplanModel2D): NormalizeResult {
  const inputFlags = validateModelIntegrity(model, false);
  if (inputFlags.length) return { model, confidence: 0, flags: inputFlags, autoAccept: false };
  const snapPoint = (p: PointMm): PointMm => ({ x: snapToGrid(p.x), z: snapToGrid(p.z) });
  const normalized: FloorplanModel2D = {
    ...model,
    outline: cleanOrthogonalPolygon(model.outline),
    rooms: model.rooms.map((r) => {
      const polygon = cleanOrthogonalPolygon(r.polygon);
      return { ...r, polygon, areaM2: polygonAreaM2(polygon) };
    }),
    walls: mergeCollinearWalls(model.walls.map((w) => ({ ...w, a: snapPoint(w.a), b: snapPoint(w.b) })))
  };

  normalized.openings = model.openings.map((opening) => {
    const before = model.walls.find((wall) => wall.id === opening.wallId);
    if (!before) return opening;
    const a = snapPoint(before.a), b = snapPoint(before.b);
    const horizontal = a.z === b.z;
    const along = horizontal ? "x" : "z";
    const across = horizontal ? "z" : "x";
    const after = normalized.walls.find((wall) => wall.a[across] === a[across] && wall.b[across] === b[across] &&
      wall.a[along] <= Math.min(a[along], b[along]) && wall.b[along] >= Math.max(a[along], b[along]));
    if (!after) return opening;
    const start = pointOnWall(before, opening.offsetMm);
    const end = pointOnWall(before, opening.offsetMm + opening.widthMm);
    return { ...opening, wallId: after.id, offsetMm: Math.min(start[along], end[along]) - after.a[along] };
  });
  const integrityFlags = validateModelIntegrity(normalized);
  if (integrityFlags.length) return { model: normalized, confidence: 0, flags: integrityFlags, autoAccept: false };
  const flags = [
    ...validateOpenings(model),
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
    autoAccept: confidence >= AUTO_ACCEPT_CONFIDENCE && flags.every((flag) => flag.code === "scale-no-chain")
  };
}
