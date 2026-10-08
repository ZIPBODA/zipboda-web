import { COLLISION_MIN_DISTANCE_M, MM_PER_M, pointInPolygon, type Opening2D, type PointMm, type Wall2D } from "@/entities/floorplan";

/**
 * 문 한가운데에서 벽 양쪽으로 비켜 선 두 점 가운데 하나라도 집 외곽 밖이면 집 밖으로 나가는 문이다.
 * 벽의 exterior 표시는 방 사이 벽에도 붙은 도면이 있어(강남개포 2-3-02 침실 문) 위치로 판정한다
 */
export function leadsOutside(door: Opening2D, wall: Wall2D, outline: PointMm[]): boolean {
  const dx = wall.b.x - wall.a.x;
  const dz = wall.b.z - wall.a.z;
  const length = Math.hypot(dx, dz);
  if (!length) return false;
  const along = (door.offsetMm + door.widthMm / 2) / length;
  const center = { x: wall.a.x + along * dx, z: wall.a.z + along * dz };
  const step = COLLISION_MIN_DISTANCE_M * MM_PER_M;
  return [1, -1].some((side) => !pointInPolygon({ x: center.x - side * dz / length * step, z: center.z + side * dx / length * step }, outline));
}
