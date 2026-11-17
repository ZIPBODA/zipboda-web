import { describe, it, expect } from "vitest";
import { getFloorplan } from "./getFloorplan";

describe("getFloorplan", () => {
  it("API가 준 도면 id(현황도 layoutKey)로 도면 자산을 찾는다", async () => {
    const floorplan = await getFloorplan("gangnam-gaepo-5-501");
    expect(floorplan?.complexId).toBe("gangnam-gaepo");
    expect(floorplan?.sourcePdf).toContain("T&K개포");
  });

  it("모르는 도면은 null이다", async () => {
    expect(await getFloorplan("missing")).toBeNull();
    expect(await getFloorplan("84")).toBeNull();
  });
});
