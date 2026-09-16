import { describe, it, expect } from "vitest";
import { findUnitRegion, type UnitRegionOptions } from "./unitRegion";
import type { MaskImage } from "../model/types";

const blank = (w: number, h: number): MaskImage => ({ data: new Uint8Array(w * h), width: w, height: h });
const set = (m: MaskImage, x: number, y: number) => {
  if (x >= 0 && y >= 0 && x < m.width && y < m.height) m.data[y * m.width + x] = 1;
};
const rectOutline = (m: MaskImage, x: number, y: number, w: number, h: number, t: number, gap?: { at: number; len: number }) => {
  for (let i = 0; i < w; i++)
    for (let k = 0; k < t; k++) {
      const inGap = gap && i >= gap.at && i < gap.at + gap.len;
      if (!inGap) set(m, x + i, y + k);
      set(m, x + i, y + h - 1 - k);
    }
  for (let j = 0; j < h; j++)
    for (let k = 0; k < t; k++) {
      set(m, x + k, y + j);
      set(m, x + w - 1 - k, y + j);
    }
};
const solidBlock = (m: MaskImage, x: number, y: number, w: number, h: number) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(m, x + i, y + j);
};

const opts: UnitRegionOptions = { cellPx: 20, minFillRatio: 0.02, maxFillRatio: 0.35, minAreaRatio: 0.01 };

describe("findUnitRegion", () => {
  it("빈 마스크는 null", () => {
    expect(findUnitRegion(blank(100, 100), opts)).toBeNull();
  });

  it("벽 사각형의 정확한 bbox를 돌려준다", () => {
    const m = blank(400, 400);
    rectOutline(m, 50, 60, 200, 240, 4);
    expect(findUnitRegion(m, opts)).toEqual({ x: 50, y: 60, width: 200, height: 240 });
  });

  it("문 틈으로 끊긴 벽도 한 영역으로 묶는다", () => {
    const m = blank(400, 400);
    // 상단 변 중앙에 15px 틈(문) — 격자(20px)로 이어진다
    rectOutline(m, 50, 60, 200, 240, 4, { at: 90, len: 15 });
    expect(findUnitRegion(m, opts)).toEqual({ x: 50, y: 60, width: 200, height: 240 });
  });

  it("속이 찬 덩어리(제목 글자·검은 막대)는 제외한다", () => {
    const m = blank(400, 400);
    solidBlock(m, 10, 10, 120, 120); // fill 1.0 — 제외 대상
    rectOutline(m, 180, 200, 160, 160, 4);
    const region = findUnitRegion(m, opts);
    expect(region).toEqual({ x: 180, y: 200, width: 160, height: 160 });
  });

  it("여러 벽 영역 중 가장 넓은 것을 고른다", () => {
    const m = blank(500, 500);
    rectOutline(m, 10, 10, 80, 80, 3);
    rectOutline(m, 200, 150, 240, 260, 4);
    expect(findUnitRegion(m, opts)).toEqual({ x: 200, y: 150, width: 240, height: 260 });
  });

  it("너무 작은 영역은 최소 면적 기준으로 버린다", () => {
    const m = blank(500, 500);
    rectOutline(m, 10, 10, 20, 20, 2);
    expect(findUnitRegion(m, { ...opts, minAreaRatio: 0.05 })).toBeNull();
  });

  it("멀리 떨어진 덩어리는 따로 본다", () => {
    const m = blank(600, 300);
    rectOutline(m, 10, 10, 100, 100, 3);
    rectOutline(m, 400, 10, 180, 180, 3);
    const region = findUnitRegion(m, opts);
    expect(region?.x).toBe(400);
    expect(region?.width).toBe(180);
  });
});
