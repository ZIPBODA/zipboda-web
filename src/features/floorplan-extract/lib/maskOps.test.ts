import { describe, it, expect } from "vitest";
import { borderComponentMask, dilateMask, erodeMask, openMask, subtractMask } from "./maskOps";
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

describe("openMask", () => {
  it("가는 벽은 지우고 굵은 덩어리만 남긴다", () => {
    // 가는 벽(두께 5) + 굵은 띠(두께 25)
    const mask = make(80, 80, (_x, y) => (20 <= y && y <= 24) || (40 <= y && y <= 64));
    const opened = openMask(mask, 8);
    expect(at(opened, 40, 22)).toBe(false);
    expect(at(opened, 40, 52)).toBe(true);
  });

  it("radius 0이면 그대로 둔다", () => {
    const mask = make(20, 20, (x) => x < 10);
    expect(count(openMask(mask, 0))).toBe(count(mask));
  });
});

describe("subtractMask", () => {
  it("빼는 쪽에 있는 픽셀을 지운다", () => {
    const base = make(4, 1, () => true);
    const remove = make(4, 1, (x) => x < 2);
    expect(Array.from(subtractMask(base, remove).data)).toEqual([0, 0, 1, 1]);
  });

  it("원본은 바꾸지 않는다", () => {
    const base = make(4, 1, () => true);
    subtractMask(base, make(4, 1, () => true));
    expect(count(base)).toBe(4);
  });
});

describe("dilateMask", () => {
  it("마스크를 부풀린다", () => {
    const mask = make(20, 20, (x, y) => x === 10 && y === 10);
    const dilated = dilateMask(mask, 2);
    expect(at(dilated, 10, 12)).toBe(true);
    expect(at(dilated, 10, 13)).toBe(false);
  });
});

describe("borderComponentMask", () => {
  const build = (rows: string[]): MaskImage => ({
    width: rows[0].length,
    height: rows.length,
    data: Uint8Array.from(rows.join("").split("").map((c) => (c === "#" ? 1 : 0)))
  });
  const render = (mask: MaskImage) =>
    Array.from({ length: mask.height }, (_, y) =>
      Array.from({ length: mask.width }, (_, x) => (mask.data[y * mask.width + x] === 1 ? "#" : ".")).join("")
    );

  it("테두리에 닿은 덩어리만 남기고 안쪽 덩어리는 버린다", () => {
    const mask = build([
      "#####",
      "#....",
      "#.##.",
      "#.##.",
      "....."
    ]);
    expect(render(borderComponentMask(mask))).toEqual(["#####", "#....", "#....", "#....", "....."]);
  });

  it("벽이 없으면 빈 마스크를 돌려준다", () => {
    expect(render(borderComponentMask(build([".."])))).toEqual([".."]);
  });
});
