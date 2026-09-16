import { describe, it, expect } from "vitest";
import { exteriorSide, paintExteriorWallBodies, snapExteriorSegments } from "./exteriorWalls";

// 300×400px 크롭, 10mm/px → 외벽 상한 300mm = 30px
const crop = { x: 0, y: 0, width: 300, height: 400 };

describe("snapExteriorSegments", () => {
  it("가장자리에 닿은 두꺼운 덩어리는 300mm로 자르고 중심선을 가장자리에 붙인다", () => {
    const [snapped] = snapExteriorSegments([{ a: { x: 30, y: 0 }, b: { x: 30, y: 399 }, thicknessPx: 60 }], crop, 10);
    expect(snapped).toEqual({ a: { x: 15, y: 0 }, b: { x: 15, y: 399 }, thicknessPx: 30 });
  });

  it("반대쪽 가장자리는 마지막 픽셀 기준으로 붙인다", () => {
    const [snapped] = snapExteriorSegments([{ a: { x: 0, y: 390 }, b: { x: 299, y: 390 }, thicknessPx: 16 }], crop, 10);
    expect(snapped).toEqual({ a: { x: 0, y: 391 }, b: { x: 299, y: 391 }, thicknessPx: 16 });
  });

  it("실내 벽은 건드리지 않는다", () => {
    const interior = { a: { x: 150, y: 20 }, b: { x: 150, y: 380 }, thicknessPx: 12 };
    expect(snapExteriorSegments([interior], crop, 10)).toEqual([interior]);
  });

  it("두꺼운 덩어리는 가장자리에서 두께만큼 떨어져 있어도 외벽으로 본다", () => {
    // 몸통 y 660~700 근처 상자가 가장자리에서 두께(40px) 이내 → 외벽
    const [snapped] = snapExteriorSegments([{ a: { x: 0, y: 350 }, b: { x: 100, y: 350 }, thicknessPx: 40 }], crop, 10);
    expect(snapped.thicknessPx).toBe(30);
    expect(snapped.a.y).toBe(384);
  });
});

describe("paintExteriorWallBodies", () => {
  it("외벽 몸통을 가장자리에 붙여 칠하고 안쪽 inset은 비워 둔다", () => {
    const mask = { data: new Uint8Array(300 * 400), width: 300, height: 400 };
    // 우측 외벽: 중심 x=290, 두께 12px(몸통 284~295) — 크롭 마지막 픽셀 299까지 4px 틈이 있다
    const painted = paintExteriorWallBodies(mask, [{ a: { x: 290, y: 50 }, b: { x: 290, y: 350 }, thicknessPx: 12 }], crop, 10, 3);
    const at = (x: number, y: number) => painted.data[y * 300 + x] === 1;
    expect(at(299, 200)).toBe(true);
    expect(at(291, 200)).toBe(true);
    expect(at(290, 200)).toBe(false);
    expect(at(299, 20)).toBe(false);
  });

  it("실내 벽은 칠하지 않는다", () => {
    const mask = { data: new Uint8Array(300 * 400), width: 300, height: 400 };
    const painted = paintExteriorWallBodies(mask, [{ a: { x: 150, y: 20 }, b: { x: 150, y: 380 }, thicknessPx: 12 }], crop, 10, 3);
    expect(painted.data.every((v) => v === 0)).toBe(true);
  });
});

describe("exteriorSide", () => {
  it("가장자리에 닿은 쪽을 돌려준다", () => {
    expect(exteriorSide({ a: { x: 0, y: 5 }, b: { x: 299, y: 5 }, thicknessPx: 10 }, crop)).toBe("start");
    expect(exteriorSide({ a: { x: 0, y: 394 }, b: { x: 299, y: 394 }, thicknessPx: 10 }, crop)).toBe("end");
    expect(exteriorSide({ a: { x: 0, y: 200 }, b: { x: 299, y: 200 }, thicknessPx: 10 }, crop)).toBeNull();
  });
});
