import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalkRenderQuality } from "./WalkRenderQuality";

const fiber = vi.hoisted(() => ({
  frame: (_: unknown, _dt: number) => {},
  dpr: 1,
  gl: { getPixelRatio: (): number => fiber.dpr },
  setDpr: vi.fn((value: number) => { fiber.dpr = value; })
}));
vi.mock("@react-three/fiber", () => ({ useThree: () => fiber, useFrame: (callback: typeof fiber.frame) => { fiber.frame = callback; } }));
const advance = (fps: number, seconds: number) => act(() => { for (let i = 0; i < fps * seconds; i++) fiber.frame({}, 1 / fps); });

describe("워크스루 렌더 품질", () => {
  beforeEach(() => { fiber.dpr = 1; fiber.setDpr.mockClear(); });
  it("원활한 환경에서는 해상도를 유지한다", () => {
    render(<WalkRenderQuality />);
    advance(60, 8);
    expect(fiber.dpr).toBe(1);
  });
  it("저속 환경에서만 해상도를 단계적으로 낮추고 복귀 시 원래 해상도를 복원한다", () => {
    const { unmount } = render(<WalkRenderQuality />);
    advance(10, 1);
    expect(fiber.dpr).toBe(1);
    advance(10, 3);
    expect(fiber.dpr).toBeLessThan(1);
    expect(fiber.dpr).toBeGreaterThan(0.4);
    advance(10, 10);
    expect(fiber.dpr).toBe(0.4);
    unmount();
    expect(fiber.dpr).toBe(1);
  });
});
