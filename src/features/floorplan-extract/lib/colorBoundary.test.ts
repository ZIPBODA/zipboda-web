import { describe, it, expect } from "vitest";
import { colorBoundaryMask, unionMask } from "./colorBoundary";
import type { CropRect, MaskImage, RgbaImage } from "../model/types";

const makeImage = (w: number, h: number, color: (x: number, y: number) => [number, number, number]): RgbaImage => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = color(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  return { data, width: w, height: h };
};

const crop: CropRect = { x: 0, y: 0, width: 64, height: 64 };
const on = (m: MaskImage, x: number, y: number) => m.data[y * m.width + x] === 1;

describe("colorBoundaryMask", () => {
  it("바닥 색이 바뀌는 가로 경계에 선을 긋는다", () => {
    // 위=주방색(224,166,142), 아래=거실색(237,218,173) — 실측 색거리 62
    const image = makeImage(64, 64, (_x, y) => (y < 32 ? [224, 166, 142] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, crop, 8, 40);
    expect(on(mask, 10, 32)).toBe(true);
    expect(on(mask, 10, 10)).toBe(false);
  });

  it("세로 경계도 찾는다", () => {
    const image = makeImage(64, 64, (x) => (x < 32 ? [224, 166, 142] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, crop, 8, 40);
    expect(on(mask, 32, 10)).toBe(true);
  });

  it("무늬 노이즈(색거리 17 수준)로는 경계를 만들지 않는다", () => {
    const image = makeImage(64, 64, (x, y) => [220 + ((x + y) % 10), 170 + ((x * y) % 10), 150 + (x % 8)]);
    const mask = colorBoundaryMask(image, crop, 8, 40);
    expect(mask.data.every((v) => v === 0)).toBe(true);
  });

  it("단색이면 경계가 없다", () => {
    const mask = colorBoundaryMask(makeImage(64, 64, () => [200, 200, 200]), crop, 8, 40);
    expect(mask.data.every((v) => v === 0)).toBe(true);
  });

  it("크롭 위치를 반영해 샘플링한다", () => {
    const image = makeImage(128, 128, (_x, y) => (y < 80 ? [224, 166, 142] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, { x: 0, y: 48, width: 64, height: 64 }, 8, 40);
    // 이미지 y=80 → 크롭 기준 y=32
    expect(on(mask, 10, 32)).toBe(true);
  });
});

describe("unionMask", () => {
  it("어느 쪽이든 벽이면 벽으로 합친다", () => {
    const a: MaskImage = { data: new Uint8Array([1, 0, 0, 0]), width: 2, height: 2 };
    const b: MaskImage = { data: new Uint8Array([0, 1, 0, 0]), width: 2, height: 2 };
    expect(Array.from(unionMask(a, b).data)).toEqual([1, 1, 0, 0]);
  });

  it("원본은 바꾸지 않는다", () => {
    const a: MaskImage = { data: new Uint8Array([0, 0]), width: 2, height: 1 };
    unionMask(a, { data: new Uint8Array([1, 1]), width: 2, height: 1 });
    expect(Array.from(a.data)).toEqual([0, 0]);
  });
});
