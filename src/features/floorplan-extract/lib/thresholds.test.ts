import { describe, it, expect } from "vitest";
import { wallThresholds } from "./thresholds";

/** 밝기별 픽셀 수로 회색 버퍼를 만든다 */
function grayOf(levels: Record<number, number>): Uint8Array {
  const parts: number[] = [];
  for (const [level, count] of Object.entries(levels)) for (let i = 0; i < count; i++) parts.push(Number(level));
  return Uint8Array.from(parts);
}

describe("wallThresholds", () => {
  it("검정 벽과 갈색 가구가 함께 있으면 둘 사이 골을 잉크 경계로 잡는다", () => {
    // 종이 240, 바닥 200, 가구 120, 벽 60 (test2.jpg 실측 분포를 축소)
    const gray = grayOf({ 240: 5000, 200: 3000, 120: 800, 60: 1200 });
    const { dark, ink } = wallThresholds(gray);
    expect(60).toBeLessThan(ink);
    expect(ink).toBeLessThan(120);
    expect(120).toBeLessThanOrEqual(dark);
    expect(dark).toBeLessThan(200);
  });

  it("어두운 스캔에서도 벽과 가구를 가른다(검정 15·가구 70)", () => {
    const gray = grayOf({ 230: 5000, 170: 3000, 70: 800, 15: 1200 });
    const { ink } = wallThresholds(gray);
    expect(15).toBeLessThan(ink);
    expect(ink).toBeLessThan(70);
  });

  it("가구가 없어 어두운 픽셀이 한 봉이면 검정점과 어두운 상한의 중간으로 물러선다", () => {
    const gray = grayOf({ 245: 5000, 210: 3000, 55: 1500, 60: 500 });
    const { dark, ink } = wallThresholds(gray);
    expect(ink).toBeGreaterThan(60);
    expect(ink).toBeLessThan(dark);
  });

  it("빈 입력은 기본 범위 안의 값을 돌려준다", () => {
    const { dark, ink } = wallThresholds(new Uint8Array(0));
    expect(ink).toBeLessThanOrEqual(dark);
  });
});
