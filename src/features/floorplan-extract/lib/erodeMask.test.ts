import { describe, it, expect } from "vitest";
import { erodeMask } from "./erodeMask";
import type { MaskImage } from "../model/types";

const make = (w: number, h: number, on: (x: number, y: number) => boolean): MaskImage => {
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) data[y * w + x] = 1;
  return { data, width: w, height: h };
};
const at = (m: MaskImage, x: number, y: number) => m.data[y * m.width + x] === 1;
const count = (m: MaskImage) => m.data.reduce((s, v) => s + v, 0);

describe("erodeMask", () => {
  it("두꺼운 벽을 양쪽에서 깎는다", () => {
    // y 20~30 (두께 11)인 가로 벽
    const mask = make(60, 60, (_x, y) => 20 <= y && y <= 30);
    const eroded = erodeMask(mask, 2);
    expect(at(eroded, 30, 20)).toBe(false);
    expect(at(eroded, 30, 22)).toBe(true);
    expect(at(eroded, 30, 28)).toBe(true);
    expect(at(eroded, 30, 30)).toBe(false);
  });

  it("두께보다 크게 깎으면 벽이 사라진다", () => {
    const mask = make(40, 40, (_x, y) => y === 20);
    expect(count(erodeMask(mask, 1))).toBe(0);
  });

  it("radius 0이면 그대로 둔다", () => {
    const mask = make(20, 20, (x, y) => x === y);
    expect(count(erodeMask(mask, 0))).toBe(count(mask));
  });

  it("바깥은 벽으로 보지 않아 경계 벽이 통째로 깎이지 않는다", () => {
    // 위쪽 경계에 붙은 두께 6 벽
    const mask = make(40, 40, (_x, y) => y <= 5);
    const eroded = erodeMask(mask, 2);
    expect(at(eroded, 20, 0)).toBe(true);
    expect(at(eroded, 20, 3)).toBe(true);
    expect(at(eroded, 20, 5)).toBe(false);
  });

  it("원본은 바꾸지 않는다", () => {
    const mask = make(20, 20, () => true);
    erodeMask(mask, 3);
    expect(count(mask)).toBe(400);
  });
});

