import {
  CEILING_HEIGHT_M,
  DOOR_HEIGHT_M,
  ENTRANCE_LABEL,
  MM_PER_M,
  WINDOW_SILL_M,
  WINDOW_TOP_M,
  polygonAreaMm2,
  polygonBBox,
  type FloorplanModel2D,
  type Opening2D,
  type PointMm,
  type Room2D,
  type SceneSegment,
  type Wall2D
} from "@/entities/floorplan";
import { FIXTURE_HEIGHT_M, ROOM_FLOOR_COLOR } from "../config/constants";

export interface ScenePoint {
  x: number;
  z: number;
}

/** 1인칭 시작 포즈. yaw는 three.js 카메라 관례(전방 = (-sin yaw, -cos yaw)) */
export interface SceneSpawn {
  x: number;
  z: number;
  yaw: number;
}

/** BoxGeometry(length, height, thickness)를 (cx, yCenter, cz)에 angleY로 배치 */
export interface SceneWallBox {
  cx: number;
  cz: number;
  yCenter: number;
  length: number;
  height: number;
  thickness: number;
  angleY: number;
}

export interface SceneFloorSlab {
  roomId: string;
  label: Room2D["label"];
  polygon: ScenePoint[];
  /** 방 무게중심 — 미니맵 라벨·이동 핫스팟 목적지 */
  center: ScenePoint;
  color: string;
}

export interface SceneFixtureBox {
  type: keyof typeof FIXTURE_HEIGHT_M;
  cx: number;
  cz: number;
  width: number;
  depth: number;
  height: number;
}

export interface BuiltScene {
  widthM: number;
  depthM: number;
  walls: SceneWallBox[];
  floors: SceneFloorSlab[];
  fixtures: SceneFixtureBox[];
  /** 1인칭 충돌용 — 문 구간은 제외해 통과 가능, 창·벽은 포함 */
  collision: SceneSegment[];
  spawn: SceneSpawn;
}

interface Span {
  start: number;
  end: number;
}

interface WallGeometry {
  a: ScenePoint;
  dirX: number;
  dirZ: number;
  lengthM: number;
  thicknessM: number;
  angleY: number;
}

function makeConverter(model: FloorplanModel2D) {
  const box = polygonBBox(model.outline);
  const widthM = (box.maxX - box.minX) / MM_PER_M;
  const depthM = (box.maxZ - box.minZ) / MM_PER_M;
  const toScene = (p: PointMm): ScenePoint => ({
    x: (p.x - box.minX) / MM_PER_M - widthM / 2,
    z: (p.z - box.minZ) / MM_PER_M - depthM / 2
  });
  return { widthM, depthM, toScene };
}

function wallGeometry(wall: Wall2D, toScene: (p: PointMm) => ScenePoint): WallGeometry {
  const a = toScene(wall.a);
  const b = toScene(wall.b);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthM = Math.hypot(dx, dz);
  const safe = lengthM === 0 ? 1 : lengthM;
  return { a, dirX: dx / safe, dirZ: dz / safe, lengthM, thicknessM: wall.thicknessMm / MM_PER_M, angleY: Math.atan2(dz, dx) };
}

const pointAlong = (g: WallGeometry, alongM: number): ScenePoint => ({ x: g.a.x + g.dirX * alongM, z: g.a.z + g.dirZ * alongM });

function boxOnWall(g: WallGeometry, span: Span, yBottom: number, yTop: number): SceneWallBox {
  const center = pointAlong(g, (span.start + span.end) / 2);
  return {
    cx: center.x,
    cz: center.z,
    yCenter: (yBottom + yTop) / 2,
    length: span.end - span.start,
    height: yTop - yBottom,
    thickness: g.thicknessM,
    angleY: g.angleY
  };
}

const segmentOnWall = (g: WallGeometry, span: Span): SceneSegment => {
  const s = pointAlong(g, span.start);
  const e = pointAlong(g, span.end);
  return { x1: s.x, z1: s.z, x2: e.x, z2: e.z };
};

/** 3인칭 dollhouse용 — 벽 상단을 maxHeight에서 잘라 내부가 보이게 한다. 컷 높이 위에만 있는 인방은 제외 */
export function clampWallsToHeight(walls: SceneWallBox[], maxHeight: number): SceneWallBox[] {
  const clamped: SceneWallBox[] = [];
  for (const wall of walls) {
    const bottom = wall.yCenter - wall.height / 2;
    const top = Math.min(wall.yCenter + wall.height / 2, maxHeight);
    if (top - bottom <= 0) continue;
    clamped.push({ ...wall, yCenter: (bottom + top) / 2, height: top - bottom });
  }
  return clamped;
}

/** [0, length]에서 개구부 구간을 뺀 나머지(벽이 남는 구간) */
export function solidSpans(lengthM: number, openings: Span[]): Span[] {
  const sorted = [...openings].sort((p, q) => p.start - q.start);
  const spans: Span[] = [];
  let cursor = 0;
  for (const o of sorted) {
    const start = Math.max(0, Math.min(lengthM, o.start));
    const end = Math.max(0, Math.min(lengthM, o.end));
    if (start > cursor) spans.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < lengthM) spans.push({ start: cursor, end: lengthM });
  return spans.filter((s) => s.end - s.start > 0);
}

function openingSpan(opening: Opening2D): Span {
  const start = opening.offsetMm / MM_PER_M;
  return { start, end: start + opening.widthMm / MM_PER_M };
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

/** three.js 카메라 yaw — 전방 벡터 (-sin yaw, -cos yaw)가 (dx, dz)를 향하도록 */
export function yawTowards(dx: number, dz: number): number {
  return Math.atan2(-dx, -dz);
}

const largestOf = (rooms: Room2D[]): Room2D | null =>
  rooms.reduce<Room2D | null>((best, room) => (best === null || polygonAreaMm2(room.polygon) > polygonAreaMm2(best.polygon) ? room : best), null);

/**
 * 1인칭 시작 위치를 고른다. 현관이 있으면 현관에서 가장 넓은 방을 바라보고 선다.
 *
 * 방 이름이 인쇄되지 않은 도면도 있고 OCR이 놓치기도 한다. 그때 외곽 무게중심을 쓰면
 * 벽 속이나 방이 아닌 곳에서 시작할 수 있으므로, 가장 넓은 방 안에서 그다음 방을 바라보게 한다.
 */
function pickSpawn(model: FloorplanModel2D, toScene: (p: PointMm) => ScenePoint): SceneSpawn {
  const outlineCenter = polygonCentroid(model.outline);
  const entrance = model.rooms.find((room) => room.label === ENTRANCE_LABEL);
  const largest = largestOf(model.rooms.filter((room) => room !== entrance));

  const origin = entrance ?? largest;
  const spawnMm = origin ? polygonCentroid(origin.polygon) : outlineCenter;

  const target = largestOf(model.rooms.filter((room) => room !== origin));
  const targetMm = target ? polygonCentroid(target.polygon) : outlineCenter;

  const spawn = toScene(spawnMm);
  const look = toScene(targetMm);
  return { x: spawn.x, z: spawn.z, yaw: yawTowards(look.x - spawn.x, look.z - spawn.z) };
}

/**
 * 2D 모델(mm)을 뷰어가 그릴 3D 박스·바닥·충돌 데이터(미터, 중앙 원점)로 변환한다.
 * 개구부는 CSG 대신 벽을 구간 분할하고 문 위 인방·창 아래 실/위 인방 박스를 두어 실제로 비운다.
 */
export function buildScene(model: FloorplanModel2D): BuiltScene {
  const { widthM, depthM, toScene } = makeConverter(model);
  const openingsByWall = new Map<string, Opening2D[]>();
  for (const o of model.openings) openingsByWall.set(o.wallId, [...(openingsByWall.get(o.wallId) ?? []), o]);

  const walls: SceneWallBox[] = [];
  const collision: SceneSegment[] = [];

  for (const wall of model.walls) {
    const g = wallGeometry(wall, toScene);
    if (g.lengthM === 0) continue;
    const openings = openingsByWall.get(wall.id) ?? [];

    for (const span of solidSpans(g.lengthM, openings.map(openingSpan))) {
      walls.push(boxOnWall(g, span, 0, CEILING_HEIGHT_M));
      collision.push(segmentOnWall(g, span));
    }
    for (const opening of openings) {
      const span = openingSpan(opening);
      if (opening.type === "door") {
        walls.push(boxOnWall(g, span, DOOR_HEIGHT_M, CEILING_HEIGHT_M));
        continue;
      }
      walls.push(boxOnWall(g, span, 0, WINDOW_SILL_M));
      walls.push(boxOnWall(g, span, WINDOW_TOP_M, CEILING_HEIGHT_M));
      collision.push(segmentOnWall(g, span));
    }
  }

  const floors: SceneFloorSlab[] = model.rooms.map((room) => ({
    roomId: room.id,
    label: room.label,
    polygon: room.polygon.map(toScene),
    center: toScene(polygonCentroid(room.polygon)),
    color: ROOM_FLOOR_COLOR[room.label]
  }));

  const fixtures: SceneFixtureBox[] = (model.fixtures ?? []).map((fixture) => {
    const box = polygonBBox(fixture.polygon);
    const center = toScene({ x: (box.minX + box.maxX) / 2, z: (box.minZ + box.maxZ) / 2 });
    return {
      type: fixture.type,
      cx: center.x,
      cz: center.z,
      width: (box.maxX - box.minX) / MM_PER_M,
      depth: (box.maxZ - box.minZ) / MM_PER_M,
      height: FIXTURE_HEIGHT_M[fixture.type]
    };
  });

  return { widthM, depthM, walls, floors, fixtures, collision, spawn: pickSpawn(model, toScene) };
}
