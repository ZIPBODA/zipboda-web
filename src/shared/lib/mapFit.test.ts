import { describe, it, expect } from "vitest";
import { MAP_ZOOM_RANGE, METERS_PER_DEGREE } from "../config/map";
import { estimateFitView } from "./mapFit";

// 위도 37.5~37.6, 경도 127~127.1 — 세로 약 11km, 가로 약 8.8km
const bounds = { south: 37.5, west: 127, north: 37.6, east: 127.1 };
const square = { width: 400, height: 400 };
const noPadding = [0, 0, 0, 0] as const;

describe("estimateFitView", () => {
  it("범위가 다 들어가는 가장 가까운 배율을 고르고 범위 가운데를 중심에 둔다", () => {
    // 7단계(16m/px)면 세로 11km가 695px로 넘치고, 8단계(32m/px)면 348px로 들어간다
    const view = estimateFitView(bounds, square, noPadding);
    expect(view?.level).toBe(8);
    expect(view?.center.lat).toBeCloseTo(37.55, 8);
    expect(view?.center.lng).toBeCloseTo(127.05, 8);
  });

  it("가려진 쪽만큼 배율을 넉넉히 잡고, 남은 화면 가운데에 범위가 오도록 중심을 반대로 민다", () => {
    const view = estimateFitView(bounds, square, [0, 0, 100, 0]);
    // 남은 높이 300px에는 8단계 348px이 넘쳐 9단계(64m/px)로 물러난다
    expect(view?.level).toBe(9);
    // 아래 100px이 가려졌으니 범위 가운데는 중심보다 50px 위, 즉 중심은 범위 가운데보다 50px(3.2km) 아래다
    expect(view?.center.lat).toBeCloseTo(37.55 - (50 * 64) / METERS_PER_DEGREE, 8);
    expect(view?.center.lng).toBeCloseTo(127.05, 8);
  });

  it("한 점이면 가장 가까운 배율, 나라 전체보다 넓으면 가장 먼 배율에서 멈춘다", () => {
    expect(estimateFitView({ south: 37.5, west: 127, north: 37.5, east: 127 }, square, noPadding)?.level).toBe(MAP_ZOOM_RANGE.min);
    expect(estimateFitView({ south: 0, west: 0, north: 80, east: 170 }, square, noPadding)?.level).toBe(MAP_ZOOM_RANGE.max);
  });

  it("지도가 아직 크기를 갖지 않았거나 가림이 화면을 다 덮으면 어림하지 않는다", () => {
    expect(estimateFitView(bounds, { width: 0, height: 0 }, noPadding)).toBeNull();
    expect(estimateFitView(bounds, square, [0, 0, 400, 0])).toBeNull();
  });
});
