import { BoxGeometry } from "three";
import { WALL_MATERIAL_GROUPS } from "../config/constants";

export function wallBoxGeometry(length: number, height: number, thickness: number): BoxGeometry {
  const geometry = new BoxGeometry(length, height, thickness);
  // 단면 4개와 벽지 2개의 재질이 각각 같으므로 6회 대신 2회 그린다.
  geometry.clearGroups();
  for (const group of WALL_MATERIAL_GROUPS) geometry.addGroup(group.start, group.count, group.materialIndex);
  return geometry;
}
