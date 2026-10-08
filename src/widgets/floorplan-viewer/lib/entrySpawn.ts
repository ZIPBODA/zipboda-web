import { COLLISION_MIN_DISTANCE_M, MM_PER_M, pointInPolygon, polygonInteriorPoint, type FloorplanModel2D, type PointMm } from "@/entities/floorplan";
import { WALK_ENTRY_EXCLUDED_LABELS, WALK_ENTRY_OFFSET_MM } from "../config/constants";

function distanceToWall(point: PointMm, a: PointMm, b: PointMm): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSquared)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.z - a.z - t * dz);
}

export function entrySpawn(model: FloorplanModel2D): { position: PointMm; look: PointMm } | null {
  for (const opening of model.openings) {
    const wall = model.walls.find((candidate) => candidate.id === opening.wallId);
    if (opening.type !== "door" || !wall?.exterior) continue;
    const dx = wall.b.x - wall.a.x;
    const dz = wall.b.z - wall.a.z;
    const length = Math.hypot(dx, dz);
    if (!length) continue;
    const along = (opening.offsetMm + opening.widthMm / 2) / length;
    const door = { x: wall.a.x + along * dx, z: wall.a.z + along * dz };

    for (const side of [1, -1]) {
      const position = { x: door.x - side * dz / length * WALK_ENTRY_OFFSET_MM, z: door.z + side * dx / length * WALK_ENTRY_OFFSET_MM };
      const room = model.rooms.find((candidate) => !WALK_ENTRY_EXCLUDED_LABELS.includes(candidate.label) && pointInPolygon(position, candidate.polygon));
      if (!room || !pointInPolygon(position, model.outline)) continue;
      const isClear = model.walls.every((candidate) => distanceToWall(position, candidate.a, candidate.b) >= COLLISION_MIN_DISTANCE_M * MM_PER_M + candidate.thicknessMm / 2);
      const inFixture = model.fixtures?.some((fixture) => pointInPolygon(position, fixture.polygon));
      if (!isClear || inFixture) continue;
      return { position, look: polygonInteriorPoint(room.polygon) };
    }
  }
  return null;
}
