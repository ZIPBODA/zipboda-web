import { describe, it, expect } from "vitest";
import { DEFAULT_FLOORPLAN_TAB, FLOORPLAN_TABS, FLOORPLAN_TAB_KEYS } from "./constants";

// 단지배치도는 원본 현황도 9건 어디에도 없다(매입임대 단일 건물). 되살아나지 않게 고정한다
describe("FLOORPLAN_TABS", () => {
  it("2D·3D·위치 세 종류만 둔다", () => {
    expect(FLOORPLAN_TABS.map((tab) => tab.key)).toEqual(["2d", "3d", "location"]);
  });

  it("단지배치도 탭이 없다", () => {
    expect(FLOORPLAN_TAB_KEYS).not.toContain("complex");
    expect(FLOORPLAN_TABS.some((tab) => tab.label.includes("단지"))).toBe(false);
  });

  it("기본 탭은 탭 목록 안에 있다", () => {
    expect(FLOORPLAN_TAB_KEYS).toContain(DEFAULT_FLOORPLAN_TAB);
  });
});
