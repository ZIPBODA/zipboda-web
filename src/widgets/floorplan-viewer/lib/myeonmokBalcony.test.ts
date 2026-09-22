import { describe, expect, it } from "vitest";
import { REVIEWED_MODELS, resolveCollision } from "@/entities/floorplan";
import { buildScene } from "./buildScene";

const scene = buildScene(REVIEWED_MODELS["jungnang-myeonmok-2-3-01"]);

function walkAcross(x: number, startZ: number, endZ: number) {
  let position = { x, z: startZ };
  const step = Math.sign(endZ - startZ) * 0.025;
  for (let i = 0; i < Math.ceil(Math.abs(endZ - startZ) / 0.025); i++) {
    position = resolveCollision(position.x, position.z + step, scene.collision);
  }
  return position;
}

describe("중랑면목동 2~3층 01호 발코니 출입", () => {
  it("미닫이 출입구 중앙에서 거실과 발코니를 양방향으로 이동한다", () => {
    expect(walkAcross(-0.57, -1.25, -2.25).z).toBeCloseTo(-2.25);
    expect(walkAcross(-0.57, -2.25, -1.25).z).toBeCloseTo(-1.25);
  });

  it("출입구 하부에는 벽이 없고 문 위 인방은 유지한다", () => {
    const crossing = scene.walls.filter((wall) =>
      Math.abs(wall.cz + 1.75) < 0.001 &&
      Math.abs(wall.cx + 0.57) < wall.length / 2
    );
    expect(crossing.length).toBeGreaterThan(0);
    expect(crossing.every((wall) => wall.yCenter - wall.height / 2 >= 2)).toBe(true);
  });

  it("미닫이문 옆 벽과 발코니 외창은 통과하지 못한다", () => {
    expect(walkAcross(1, -1.25, -2.25).z).toBeGreaterThan(-1.75);
    expect(walkAcross(-0.43, -2.35, -3.35).z).toBeGreaterThan(-2.95);
  });
});
