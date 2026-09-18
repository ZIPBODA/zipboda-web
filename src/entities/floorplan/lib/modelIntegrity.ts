import type { FloorplanModel2D, NormalizeFlag, PointMm } from "../model/types";

const finitePoint = (p: PointMm) => Number.isFinite(p.x) && Number.isFinite(p.z);
const positive = (value: number) => Number.isFinite(value) && value > 0;

export function isSimpleOrthogonalPolygon(polygon: PointMm[]): boolean {
  if (polygon.length < 4 || !polygon.every(finitePoint)) return false;
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if ((a.x === b.x) === (a.z === b.z)) return false;
    area += a.x * b.z - b.x * a.z;
    for (let j = i + 2; j < polygon.length; j++) {
      if (i === 0 && j === polygon.length - 1) continue;
      const c = polygon[j];
      const d = polygon[(j + 1) % polygon.length];
      const perpendicular = (a.x === b.x) !== (c.x === d.x);
      if (perpendicular) {
        const vertical = a.x === b.x ? [a, b] : [c, d];
        const horizontal = a.x === b.x ? [c, d] : [a, b];
        const inside = vertical[0].x > Math.min(horizontal[0].x, horizontal[1].x) &&
          vertical[0].x < Math.max(horizontal[0].x, horizontal[1].x) &&
          horizontal[0].z > Math.min(vertical[0].z, vertical[1].z) &&
          horizontal[0].z < Math.max(vertical[0].z, vertical[1].z);
        if (inside) return false;
      } else if (a.x === b.x && c.x === d.x && a.x === c.x &&
        Math.min(Math.max(a.z, b.z), Math.max(c.z, d.z)) > Math.max(Math.min(a.z, b.z), Math.min(c.z, d.z))) return false;
      else if (a.z === b.z && c.z === d.z && a.z === c.z &&
        Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) > Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x))) return false;
    }
  }
  return area !== 0;
}

export function validateModelIntegrity(model: FloorplanModel2D, orthogonal = true): NormalizeFlag[] {
  const invalid = (detail: string): NormalizeFlag => ({ code: "geometry-invalid", detail });
  const flags: NormalizeFlag[] = [];
  const polygons = [model.outline, ...model.rooms.map((room) => room.polygon), ...(model.fixtures ?? []).map((fixture) => fixture.polygon)];
  if (polygons.some((polygon) => polygon.length < 3 || !polygon.every(finitePoint))) flags.push(invalid("유효한 좌표와 면적을 가진 폴리곤이 필요합니다"));
  if (orthogonal && [model.outline, ...model.rooms.map((room) => room.polygon)].some((polygon) => !isSimpleOrthogonalPolygon(polygon))) {
    flags.push(invalid("외곽·방은 교차하지 않는 직교 폴리곤이어야 합니다"));
  }
  if (!positive(model.scale.mmPerPx)) flags.push(invalid("스케일은 유한한 양수여야 합니다"));
  if (model.rooms.length === 0) flags.push(invalid("방이 없습니다"));
  for (const items of [model.walls, model.rooms]) {
    if (new Set(items.map((item) => item.id)).size !== items.length || items.some((item) => !item.id)) flags.push(invalid("중복되거나 빈 식별자"));
  }
  if (model.walls.some((wall) => !finitePoint(wall.a) || !finitePoint(wall.b) || !positive(wall.thicknessMm) ||
    (wall.a.x === wall.b.x && wall.a.z === wall.b.z) || (orthogonal && wall.a.x !== wall.b.x && wall.a.z !== wall.b.z))) flags.push(invalid("유효하지 않은 벽"));
  if (model.printed.exclusiveAreaM2 !== undefined && !positive(model.printed.exclusiveAreaM2)) flags.push(invalid("유효하지 않은 전용면적"));
  if (model.printed.dimensionChains.some((chain) => chain.values.length === 0 || !chain.values.every(positive))) flags.push(invalid("유효하지 않은 치수 체인"));
  return flags;
}
