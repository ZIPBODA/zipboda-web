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
    const mask = colorBoundaryMask(image, crop, 8, 40, 0.35);
    expect(on(mask, 10, 32)).toBe(true);
    expect(on(mask, 10, 10)).toBe(false);
  });

  it("세로 경계도 찾는다", () => {
    const image = makeImage(64, 64, (x) => (x < 32 ? [224, 166, 142] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, crop, 8, 40, 0.35);
    expect(on(mask, 32, 10)).toBe(true);
  });

  it("무늬 노이즈(색거리 17 수준)로는 경계를 만들지 않는다", () => {
    const image = makeImage(64, 64, (x, y) => [220 + ((x + y) % 10), 170 + ((x * y) % 10), 150 + (x % 8)]);
    const mask = colorBoundaryMask(image, crop, 8, 40, 0.35);
    expect(mask.data.every((v) => v === 0)).toBe(true);
  });

  it("단색이면 경계가 없다", () => {
    const mask = colorBoundaryMask(makeImage(64, 64, () => [200, 200, 200]), crop, 8, 40, 0.35);
    expect(mask.data.every((v) => v === 0)).toBe(true);
  });

  it("크롭 위치를 반영해 샘플링한다", () => {
    const image = makeImage(128, 128, (_x, y) => (y < 80 ? [224, 166, 142] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, { x: 0, y: 48, width: 64, height: 64 }, 8, 40, 0.35);
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

describe("colorBoundaryMask 길이 필터", () => {
  it("한 변을 가로지르는 긴 경계는 방 경계로 남긴다", () => {
    const image = makeImage(64, 64, (_x, y) => (y < 32 ? [224, 166, 142] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, crop, 8, 40, 0.35);
    expect(on(mask, 32, 32)).toBe(true);
  });

  it("가구처럼 짧게 끊긴 색 차이는 경계로 삼지 않는다", () => {
    // 왼쪽 8px(블록 1칸)에만 색이 다른 사각형 — 전체 8칸 중 1칸이라 비율 미달
    const image = makeImage(64, 64, (x, y) => (x < 8 && 24 <= y && y < 32 ? [40, 40, 40] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, crop, 8, 40, 0.35);
    expect(mask.data.every((v) => v === 0)).toBe(true);
  });

  it("비율을 0으로 두면 짧은 경계도 남는다", () => {
    const image = makeImage(64, 64, (x, y) => (x < 8 && 24 <= y && y < 32 ? [40, 40, 40] : [237, 218, 173]));
    const mask = colorBoundaryMask(image, crop, 8, 40, 0);
    expect(mask.data.some((v) => v === 1)).toBe(true);
  });
});

describe("colorBoundaryMask 벽까지 늘리기", () => {
  /** 80×40, 위 절반 빨강·아래 절반 파랑. 왼쪽 greyPx만큼은 회색 가구로 위아래 색이 같다 */
  const build = (greyPx: number) => {
    const width = 80;
    const height = 40;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const [r, g, b] = x < greyPx ? [128, 128, 128] : y < 20 ? [220, 40, 40] : [40, 40, 220];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    const walls: MaskImage = { width, height, data: new Uint8Array(width * height) };
    for (let y = 0; y < height; y++) walls.data[y * width + 2] = 1;
    return { image: { data, width, height } as RgbaImage, walls, crop: { x: 0, y: 0, width, height }, width };
  };
  const at = (m: MaskImage, x: number, y: number) => m.data[y * m.width + x] === 1;

  it("벽에서 조금 모자라는 색 경계는 벽에 닿을 때까지 늘린다", () => {
    const { image, walls, crop } = build(8);
    const extended = colorBoundaryMask(image, crop, 8, 35, 0.35, walls);
    // 원래 경계는 x=8부터, 벽(x=2) 바로 옆까지 채워진다
    expect(at(extended, 5, 24)).toBe(true);
    expect(at(extended, 3, 24)).toBe(true);
    expect(at(extended, 2, 24)).toBe(false);
  });

  it("벽이 허용 틈(20%)보다 멀면 늘리지 않는다", () => {
    const { image, walls, crop } = build(32);
    const extended = colorBoundaryMask(image, crop, 8, 35, 0.35, walls);
    expect(at(extended, 20, 24)).toBe(false);
    expect(at(extended, 40, 24)).toBe(true);
  });
});

describe("colorBoundaryMask 벽 옆 색 차이", () => {
  it("벽 블록과 바닥 블록 사이의 색 차이는 경계로 삼지 않는다", () => {
    // 80×40: 왼콽 8px은 검정 벽, 나머지는 한 가지 바닥색
    const width = 80;
    const height = 40;
    const data = new Uint8ClampedArray(width * height * 4);
    const walls: MaskImage = { width, height, data: new Uint8Array(width * height) };
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const isWall = x < 8;
        const [r, g, b] = isWall ? [40, 40, 40] : [230, 200, 150];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
        if (isWall) walls.data[y * width + x] = 1;
      }
    const crop = { x: 0, y: 0, width, height };
    const bare = colorBoundaryMask({ data, width, height }, crop, 8, 35, 0.35);
    const aware = colorBoundaryMask({ data, width, height }, crop, 8, 35, 0.35, walls);
    expect(bare.data.some((v) => v === 1)).toBe(true);
    expect(aware.data.some((v) => v === 1)).toBe(false);
  });
});

describe("colorBoundaryMask 벽에서 벽까지", () => {
  it("축 비율에 못 미쳐도 양 끝이 벽에 닿는 색 경계는 방 경계다", () => {
    // 200×60, 10mm/px. 벽 x=50·x=150 사이(100px=1000mm=폭 50%)만 위 타일·아래 마루로 색이 다르다 → 비율 0.6에는 못 미친다
    const width = 200;
    const height = 60;
    const data = new Uint8ClampedArray(width * height * 4);
    const walls: MaskImage = { width, height, data: new Uint8Array(width * height) };
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const inside = 50 < x && x < 150;
        const [r, g, b] = inside && y < 30 ? [200, 200, 210] : [200, 150, 90];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
        if (x === 50 || x === 150) walls.data[y * width + x] = 1;
      }
    const crop = { x: 0, y: 0, width, height };
    const byRatio = colorBoundaryMask({ data, width, height }, crop, 8, 35, 0.6, walls);
    const wallToWall = colorBoundaryMask({ data, width, height }, crop, 8, 35, 0.6, walls, 10);
    const rowHas = (m: MaskImage) => Array.from({ length: height }, (_, y) => m.data[y * width + 100] === 1).some(Boolean);
    expect(rowHas(byRatio)).toBe(false);
    expect(rowHas(wallToWall)).toBe(true);
  });
});
