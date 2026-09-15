import { describe, it, expect } from "vitest";
import { assignRegionLabels, pointInPolygon } from "./labelAssign";
import type { OcrTextToken, RoomRegion } from "../model/types";

const rect = (x: number, y: number, w: number, h: number) => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h }
];

const region = (id: string, x: number, y: number, w: number, h: number): RoomRegion => ({
  id,
  bbox: { minX: x, minY: y, maxX: x + w - 1, maxY: y + h - 1 },
  polygon: rect(x, y, w, h),
  areaPx: w * h,
  touchesBorder: false
});

const token = (text: string, x: number, y: number): OcrTextToken => ({ text, center: { x, y }, width: 20, height: 12 });

describe("pointInPolygon", () => {
  it("사각형 안팎을 구분한다", () => {
    const poly = rect(0, 0, 10, 10);
    expect(pointInPolygon({ x: 5, y: 5 }, poly)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, poly)).toBe(false);
  });

  it("ㄱ자 폴리곤의 오목한 바깥을 제외한다", () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 10 },
      { x: 0, y: 10 }
    ];
    expect(pointInPolygon({ x: 2, y: 8 }, lShape)).toBe(true);
    expect(pointInPolygon({ x: 8, y: 8 }, lShape)).toBe(false);
  });
});

describe("assignRegionLabels", () => {
  it("토큰을 위치가 속한 방에 배정한다", () => {
    const regions = [region("region-0", 0, 0, 100, 100), region("region-1", 100, 0, 100, 100)];
    const tokens = [token("욕실", 50, 50), token("주방", 150, 50)];
    const labels = assignRegionLabels(regions, tokens);
    expect(labels["region-0"].label).toBe("욕실");
    expect(labels["region-1"].label).toBe("주방");
  });

  it("토큰이 없는 방은 기타로 둔다", () => {
    const labels = assignRegionLabels([region("region-0", 0, 0, 50, 50)], []);
    expect(labels["region-0"].label).toBe("기타");
  });

  it("한 방에 여러 토큰이 있으면 확신이 큰 쪽을 쓴다", () => {
    const regions = [region("region-0", 0, 0, 100, 100)];
    const tokens = [token("1200", 20, 20), token("현관", 60, 60)];
    expect(assignRegionLabels(regions, tokens)["region-0"].label).toBe("현관");
  });

  it("다른 방 글자는 가져오지 않는다", () => {
    const regions = [region("region-0", 0, 0, 50, 50)];
    const tokens = [token("발코니", 500, 500)];
    expect(assignRegionLabels(regions, tokens)["region-0"].label).toBe("기타");
  });

  it("윤곽이 없으면 bbox로 판정한다", () => {
    const r: RoomRegion = { ...region("region-0", 0, 0, 100, 100), polygon: [] };
    expect(assignRegionLabels([r], [token("침실", 50, 50)])["region-0"].label).toBe("침실");
  });
});

