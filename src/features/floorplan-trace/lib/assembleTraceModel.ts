import { REACHABILITY_EXEMPT_UNLABELED_MAX_M2, polygonBBox, type FloorplanModel2D, type PointMm, type Room2D, type Wall2D } from "@/entities/floorplan";
import { MANUAL_ROOM_CONFIDENCE, TRACE_EXTERIOR_WALL_MM, TRACE_INTERIOR_WALL_MM, UNLABELED_ROOM_CONFIDENCE } from "../config/constants";
import type { DerivedLayout, LabeledRoom, TraceDocument } from "../model/types";
import { isBoundary } from "./snap";
import { mergeWallsRemapOpenings } from "./wallOps";

/**
 * 편집 문서 + 파생 레이아웃 → FloorplanModel2D. 외곽 좌상단을 (0,0)으로 옮겨 추출 모델과 같은 관례를 따른다.
 * 검증·신뢰도는 normalizeModel이 맡는다
 */
export function assembleTraceModel(document: TraceDocument, layout: DerivedLayout, rooms: readonly LabeledRoom[]): FloorplanModel2D | null {
  if (!document.calibration || document.walls.length === 0) return null;
  const anchorPoints = layout.outline.length > 0 ? layout.outline : document.walls.flatMap((wall) => [wall.a, wall.b]);
  const origin = anchorPoints.length > 0 ? polygonBBox(anchorPoints) : { minX: 0, minZ: 0 };
  const shift = (p: PointMm): PointMm => ({ x: p.x - origin.minX, z: p.z - origin.minZ });

  // 경계선은 방을 가를 뿐 벽이 아니다 — 3D에 세우지 않고, 두 방은 열린 통로로 이어진 것으로 검증된다
  const walls: Wall2D[] = document.walls
    .filter((wall) => !isBoundary(wall))
    .map((wall) => {
      const exterior = layout.exteriorWallIds.has(wall.id);
      return {
        id: wall.id,
        a: shift(wall.a),
        b: shift(wall.b),
        thicknessMm: wall.thicknessMm ?? (exterior ? TRACE_EXTERIOR_WALL_MM : TRACE_INTERIOR_WALL_MM),
        exterior
      };
    });
  const wallIds = new Set(walls.map((wall) => wall.id));
  const merged = mergeWallsRemapOpenings(
    walls,
    document.openings.filter((opening) => wallIds.has(opening.wallId))
  );

  // 이름 없는 1.5㎡ 이하 공간은 PS·실외기실 같은 설비 공간이다 — 자동 추출과 같이 벽은 남기고 바닥(방)으로는 세우지 않는다
  const isServiceSpace = (room: LabeledRoom) => room.label === "기타" && room.areaM2 <= REACHABILITY_EXEMPT_UNLABELED_MAX_M2;
  const kept = rooms.filter((room) => !isServiceSpace(room));
  const room2ds: Room2D[] = kept.map((room) => ({ id: room.key, label: room.label, polygon: room.polygon.map(shift), areaM2: room.areaM2 }));
  const perRoom = Object.fromEntries(kept.map((room) => [room.key, room.anchorId ? MANUAL_ROOM_CONFIDENCE : UNLABELED_ROOM_CONFIDENCE]));

  return {
    scale: { mmPerPx: document.calibration.mmPerPx, source: document.calibration.source },
    outline: layout.outline.map(shift),
    rooms: room2ds,
    walls: merged.walls,
    openings: merged.openings,
    printed: { exclusiveAreaM2: document.printed.exclusiveAreaM2, dimensionChains: document.printed.dimensionChains },
    confidence: { overall: 0, perRoom }
  };
}
