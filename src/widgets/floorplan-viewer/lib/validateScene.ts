import {
  COLLISION_MIN_DISTANCE_M,
  distanceToSegment,
  pointInPolygon,
} from "@/entities/floorplan";
import { SCENE_EXTENT_M } from "../config/constants";
import type { BuiltScene, ScenePoint } from "./buildScene";

export type SceneIssueCode =
  | "non-finite"
  | "no-walls"
  | "no-floors"
  | "wall-degenerate"
  | "floor-degenerate"
  | "spawn-outside"
  | "spawn-in-wall"
  | "bounds-abnormal";

export interface SceneIssue {
  code: SceneIssueCode;
  detail: string;
}

const finite = (...values: number[]) =>
  values.every((value) => Number.isFinite(value));
const polygonArea = (polygon: ScenePoint[]) => {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a.x * b.z - b.x * a.z;
  }
  return Math.abs(sum) / 2;
};

/**
 * buildScene 결과가 실제로 서 있을 수 있는 공간인지 본다.
 * 2D 검증(normalizeModel)을 통과해도 씬 좌표로 옮긴 뒤 스폰이 벽 속이거나 바닥이 0면적이면 워크스루가 시작부터 막힌다.
 * 새 현황도가 들어올 때마다 같은 검사를 돌릴 수 있게 모델이 아니라 씬만 받는다
 */
export function validateBuiltScene(scene: BuiltScene): SceneIssue[] {
  const issues: SceneIssue[] = [];
  const issue = (code: SceneIssueCode, detail: string) =>
    issues.push({ code, detail });

  const numbers = [
    scene.widthM,
    scene.depthM,
    scene.spawn.x,
    scene.spawn.z,
    scene.spawn.yaw,
    ...scene.walls.flatMap((w) => [
      w.cx,
      w.cz,
      w.yCenter,
      w.length,
      w.height,
      w.thickness,
      w.angleY,
    ]),
    ...scene.floors.flatMap((f) => f.polygon.flatMap((p) => [p.x, p.z])),
    ...scene.collision.flatMap((s) => [s.x1, s.z1, s.x2, s.z2]),
    ...scene.fixtures.flatMap((f) => [f.cx, f.cz, f.width, f.depth, f.height]),
  ];
  if (!finite(...numbers)) issue("non-finite", "NaN 또는 Infinity 좌표");

  if (scene.walls.length === 0) issue("no-walls", "벽 없음");
  if (scene.floors.length === 0) issue("no-floors", "바닥 없음");

  scene.walls.forEach((wall, index) => {
    if (!(wall.length > 0 && wall.height > 0 && wall.thickness > 0))
      issue(
        "wall-degenerate",
        `벽 #${index} 크기 ${wall.length}×${wall.height}×${wall.thickness}`,
      );
  });
  for (const floor of scene.floors) {
    if (floor.polygon.length < 3 || polygonArea(floor.polygon) <= 0)
      issue("floor-degenerate", `${floor.roomId} 바닥 면적 0`);
  }

  const extentOk = (v: number) =>
    SCENE_EXTENT_M.min <= v && v <= SCENE_EXTENT_M.max;
  if (!extentOk(scene.widthM) || !extentOk(scene.depthM))
    issue(
      "bounds-abnormal",
      `유닛 크기 ${scene.widthM.toFixed(2)}×${scene.depthM.toFixed(2)}m`,
    );

  const spawn = { x: scene.spawn.x, z: scene.spawn.z };
  const onFloor = scene.floors.some((floor) =>
    pointInPolygon(spawn, floor.polygon),
  );
  if (!onFloor)
    issue(
      "spawn-outside",
      `스폰 (${spawn.x.toFixed(2)}, ${spawn.z.toFixed(2)})이 어떤 방 바닥에도 없음`,
    );
  // 충돌 캡슐 안에서 시작하면 첫 프레임에 벽 밖으로 튕기거나, 벽 위에 정확히 놓이면 밀어낼 방향조차 없다
  const nearestWallM = scene.collision.reduce(
    (min, s) => Math.min(min, distanceToSegment(spawn.x, spawn.z, s)),
    Number.POSITIVE_INFINITY,
  );
  if (nearestWallM < COLLISION_MIN_DISTANCE_M)
    issue(
      "spawn-in-wall",
      `스폰과 가장 가까운 벽 ${nearestWallM.toFixed(2)}m < ${COLLISION_MIN_DISTANCE_M.toFixed(2)}m`,
    );

  return issues;
}
