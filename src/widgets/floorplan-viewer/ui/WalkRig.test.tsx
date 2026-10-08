import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera } from "three";
import { WalkRig } from "./WalkRig";
import type { AxisRef, RigRef } from "../lib/types";

const fiber = vi.hoisted(() => ({
  frame: (_: unknown, _dt: number) => {},
  state: {} as { camera: PerspectiveCamera; size: { width: number; height: number } }
}));
vi.mock("@react-three/fiber", () => ({
  useThree: () => fiber.state,
  useFrame: (callback: typeof fiber.frame) => { fiber.frame = callback; }
}));

function setup() {
  const rigRef: RigRef = { current: { x: 99, z: 99, yaw: 0, pitch: 0.5 } };
  const moveRef: AxisRef = { current: { x: 0, y: 0 } };
  const lookRef: AxisRef = { current: { x: 0, y: 0 } };
  const props = { rigRef, moveRef, lookRef, spawn: { x: 0, z: 0, yaw: 0 }, collision: [] };
  return { ...render(<WalkRig {...props} />), ...props, props };
}

function advance(seconds: number) {
  act(() => { for (let i = 0; i < seconds * 60; i++) fiber.frame({}, 1 / 60); });
}

describe("WalkRig", () => {
  beforeEach(() => {
    fiber.state = { camera: new PerspectiveCamera(70, 1280 / 900), size: { width: 1280, height: 900 } };
  });

  it("첫 프레임부터 실내 시작점의 눈높이에서 서며 리사이즈해도 위치가 유지된다", () => {
    const { rigRef, props, rerender, unmount } = setup();
    expect(fiber.state.camera.position.toArray()).toEqual([0, 1.61, 0]);
    expect(fiber.state.camera.fov).toBe(75);
    expect(fiber.state.camera.rotation.x).toBeCloseTo(-Math.PI / 18);
    rigRef.current.x = 1;
    advance(1 / 60);
    fiber.state.size = { width: 360, height: 900 };
    rerender(<WalkRig {...props} />);
    expect(fiber.state.camera.fov).toBe(85);
    expect(rigRef.current.x).toBe(1);
    unmount();
    expect(fiber.state.camera.fov).toBe(70);
  });

  it("앞으로 1초 걸으면 1.2m 이동하고 대각선도 같은 속도로 걷는다", () => {
    const { rigRef } = setup();
    fireEvent.keyDown(window, { key: "w" });
    advance(1);
    expect(rigRef.current.z).toBeCloseTo(-1.2);
    rigRef.current.z = 0;
    fireEvent.keyDown(window, { key: "d" });
    advance(1);
    expect(Math.hypot(rigRef.current.x, rigRef.current.z)).toBeCloseTo(1.2);
    expect(fiber.state.camera.position.y).toBe(1.61);
  });

  it("시선을 돌린 즉시 새 방향으로 걷고 위를 봐도 눈높이가 유지된다", () => {
    const { rigRef } = setup();
    rigRef.current.yaw = -Math.PI / 2;
    rigRef.current.pitch = 0.8;
    fireEvent.keyDown(window, { key: "w" });
    advance(1);
    expect(rigRef.current.x).toBeCloseTo(1.2);
    expect(rigRef.current.z).toBeCloseTo(0);
    expect(fiber.state.camera.position.y).toBe(1.61);
  });

  it("벽을 통과하지 않고 프레임 지연으로 순간 이동하지 않는다", () => {
    const { rigRef, props, rerender } = setup();
    rerender(<WalkRig {...props} collision={[{ x1: -2, z1: -1, x2: 2, z2: -1 }]} />);
    fireEvent.keyDown(window, { key: "w" });
    advance(2);
    expect(rigRef.current.z).toBeGreaterThanOrEqual(-0.75);
    expect(rigRef.current.z).toBeLessThan(-0.6);
    rigRef.current.z = 0;
    act(() => fiber.frame({}, 5));
    expect(rigRef.current.z).toBeCloseTo(-0.06);
  });

  it.each(["blur", "visibilitychange"])("%s 후 입력이 남아 자동으로 이동하지 않는다", (event) => {
    const { rigRef, moveRef, lookRef } = setup();
    fireEvent.keyDown(window, { key: "w" });
    moveRef.current.y = -1;
    lookRef.current.x = 1;
    fireEvent(event === "blur" ? window : document, new Event(event));
    advance(1);
    expect(rigRef.current).toEqual({ x: 0, z: 0, yaw: 0, pitch: -Math.PI / 18 });
    expect(moveRef.current).toEqual({ x: 0, y: 0 });
    expect(lookRef.current).toEqual({ x: 0, y: 0 });
  });
});
