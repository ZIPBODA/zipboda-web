import { describe, expect, it } from "vitest";
import { REVIEWED_MODELS, polygonBBox, polygonAreaMm2, pointInPolygon, resolveCollision } from "@/entities/floorplan";
import { buildScene } from "./buildScene";
import { entrySpawn } from "./entrySpawn";

describe("워크스루 실척과 시작 위치", () => {
  for (const [key, model] of Object.entries(REVIEWED_MODELS)) {
    it(`${key}: 2D mm와 3D m의 길이·면적이 일치하고 시작점이 실내에 있다`, () => {
      const scene = buildScene(model);
      const box = polygonBBox(model.outline);
      expect(scene.widthM * 1000).toBeCloseTo(box.maxX - box.minX);
      expect(scene.depthM * 1000).toBeCloseTo(box.maxZ - box.minZ);
      for (const floor of scene.floors) {
        const room = model.rooms.find((room) => room.id === floor.roomId)!;
        expect(polygonAreaMm2(floor.polygon) * 1_000_000).toBeCloseTo(polygonAreaMm2(room.polygon));
      }
      const spawnMm = { x: (scene.spawn.x + scene.widthM / 2) * 1000 + box.minX, z: (scene.spawn.z + scene.depthM / 2) * 1000 + box.minZ };
      expect(model.rooms.some((room) => pointInPolygon(spawnMm, room.polygon))).toBe(true);
      const resolved = resolveCollision(scene.spawn.x, scene.spawn.z, scene.collision);
      expect(resolved.x).toBeCloseTo(scene.spawn.x);
      expect(resolved.z).toBeCloseTo(scene.spawn.z);
    });
  }

  it("중랑면목동은 출입문 안쪽에서 거실의 긴 방향을 바라보며 문틀이 통로를 좁히지 않는다", () => {
    const model = REVIEWED_MODELS["jungnang-myeonmok-2-3-01"];
    const scene = buildScene(model);
    expect(scene.widthM).toBe(3.2);
    expect(scene.depthM).toBe(5.9);
    expect(scene.spawn.x).toBeCloseTo(0.428);
    expect(scene.spawn.z).toBeCloseTo(2.3);
    expect(Math.cos(scene.spawn.yaw)).toBeGreaterThan(0.9);
    const balconyFrames = scene.doorFrames.filter((frame) => Math.abs(frame.cz + 1.75) < 0.001);
    const jambs = balconyFrames.filter((frame) => frame.height === 2.1).sort((a, b) => a.cx - b.cx);
    expect(jambs).toHaveLength(2);
    expect((jambs[1].cx - jambs[1].length / 2) - (jambs[0].cx + jambs[0].length / 2)).toBeCloseTo(1.83);
  });

  it("출입문 후보가 발코니·설비 내부면 사용하지 않고 문이 없으면 기존 안전점으로 돌아간다", () => {
    const source = REVIEWED_MODELS["jungnang-myeonmok-2-3-01"];
    const position = entrySpawn(source)!.position;
    const noDoors = { ...source, openings: [] };
    expect(entrySpawn(noDoors)).toBeNull();
    expect(entrySpawn({ ...source, rooms: source.rooms.map((room) => ({ ...room, label: "발코니" as const })) })).toBeNull();
    expect(entrySpawn({ ...source, fixtures: [{ type: "kitchen", roomId: "room-1", polygon: [
      { x: position.x - 100, z: position.z - 100 }, { x: position.x + 100, z: position.z - 100 },
      { x: position.x + 100, z: position.z + 100 }, { x: position.x - 100, z: position.z + 100 }
    ] }] })).toBeNull();
    expect(buildScene(noDoors).spawn.z).toBeCloseTo(0.27117052023121335);
  });
});
