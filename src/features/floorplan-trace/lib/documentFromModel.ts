import { polygonInteriorPoint, type FloorplanModel2D, type PointMm, type PointPx, type Room2D } from "@/entities/floorplan";
import { BOUNDARY_THICKNESS_MM, DRAFT_HEAL_TOLERANCE_MM, MIN_BOUNDARY_EDGE_MM } from "../config/constants";
import type { TraceDocument, TraceOpening, TraceWall } from "../model/types";
import { isHorizontal, isOriented, orientWall, orthogonalize, snapPointToGrid } from "./snap";
import { healWallEndpoints, reprojectOpenings, wallLengthMm } from "./wallOps";

export const emptyDocument = (): TraceDocument => ({
  calibration: null,
  walls: [],
  openings: [],
  labelAnchors: [],
  printed: { dimensionChains: [] },
  seq: 0
});

/**
 * 자동 추출 모델을 편집 문서로 옮긴다. originPx는 모델 (0,0)이 놓인 이미지 px(= 유닛 크롭 좌상단).
 * 벽은 격자에 맞추고 a≤b로 돌린 뒤 서로 닿게 늘리며, 개구부는 그 자리에 남도록 다시 투영한다.
 * 벽 없이 나뉜 방 경계(바닥 마감·현관 타일)는 경계선으로 옮겨 추출이 찾은 방 구성을 그대로 잇는다
 */
export function documentFromModel(model: FloorplanModel2D, originPx: PointPx): TraceDocument {
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}${++seq}`;

  const oriented: TraceWall[] = [];
  const openings: TraceOpening[] = [];
  for (const wall of model.walls) {
    const a = snapPointToGrid(wall.a);
    const b = snapPointToGrid(orthogonalize(wall.b, a));
    const raw: TraceWall = { id: nextId("w"), a, b, thicknessMm: wall.thicknessMm };
    const flipped = !isOriented(raw);
    const traceWall = orientWall(raw);
    oriented.push(traceWall);
    const length = wallLengthMm(traceWall);
    for (const opening of model.openings) {
      if (opening.wallId !== wall.id) continue;
      const offsetMm = flipped ? length - opening.offsetMm - opening.widthMm : opening.offsetMm;
      openings.push({ ...opening, id: nextId("o"), wallId: traceWall.id, offsetMm });
    }
  }
  const boundaries = boundariesFromRooms(model.rooms, oriented, () => nextId("w"));

  const healed = healWallEndpoints([...oriented, ...boundaries], DRAFT_HEAL_TOLERANCE_MM);
  const reprojected = oriented.reduce((acc, before, index) => reprojectOpenings(acc, before, healed[index]), openings);

  const labelAnchors = model.rooms
    .filter((room) => room.label !== "기타" && room.polygon.length >= 3)
    .map((room) => ({ id: nextId("l"), at: polygonInteriorPoint(room.polygon), label: room.label }));

  return {
    calibration: { mmPerPx: model.scale.mmPerPx, originPx, source: model.scale.source },
    walls: healed,
    openings: reprojected,
    labelAnchors,
    printed: { exclusiveAreaM2: model.printed.exclusiveAreaM2, dimensionChains: [...model.printed.dimensionChains] },
    seq
  };
}

/** 방 폴리곤의 변 중 어떤 벽도 덮지 않는 변을 경계선으로 만든다. 이웃 방의 같은 변은 먼저 만든 경계선이 덮으므로 한 번만 생긴다 */
function boundariesFromRooms(rooms: readonly Room2D[], walls: readonly TraceWall[], nextId: () => string): TraceWall[] {
  const added: TraceWall[] = [];
  for (const room of rooms) {
    const { polygon } = room;
    for (let i = 0; i < polygon.length; i++) {
      const p = snapPointToGrid(polygon[i]);
      const q = snapPointToGrid(polygon[(i + 1) % polygon.length]);
      const horizontal = p.z === q.z;
      const vertical = p.x === q.x;
      if (horizontal === vertical) continue;
      if (Math.hypot(q.x - p.x, q.z - p.z) < MIN_BOUNDARY_EDGE_MM) continue;
      const edge = { a: p, b: q };
      if ([...walls, ...added].some((wall) => coversEdge(wall, edge, DRAFT_HEAL_TOLERANCE_MM))) continue;
      added.push(orientWall({ id: nextId(), a: p, b: q, thicknessMm: BOUNDARY_THICKNESS_MM }));
    }
  }
  return added;
}

/** 벽이 변과 나란히(허용치 안) 놓이고 변의 양 끝을 모두 품으면 그 변은 이미 벽으로 표현된 것이다 */
function coversEdge(wall: Pick<TraceWall, "a" | "b">, edge: { a: PointMm; b: PointMm }, toleranceMm: number): boolean {
  const horizontal = isHorizontal(edge);
  if (isHorizontal(wall) !== horizontal) return false;
  const along = horizontal ? "x" : "z";
  const across = horizontal ? "z" : "x";
  if (Math.abs(wall.a[across] - edge.a[across]) > toleranceMm) return false;
  const wallMin = Math.min(wall.a[along], wall.b[along]) - toleranceMm;
  const wallMax = Math.max(wall.a[along], wall.b[along]) + toleranceMm;
  const edgeMin = Math.min(edge.a[along], edge.b[along]);
  const edgeMax = Math.max(edge.a[along], edge.b[along]);
  return wallMin <= edgeMin && edgeMax <= wallMax;
}
