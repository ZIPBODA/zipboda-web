import { describe, it, expect } from "vitest";
import { getFloorplan } from "./getFloorplan";

describe("getFloorplan", () => {
  it("resolves an exact stable unit key", async () => {
    const floorplan = await getFloorplan("gangnam-gaepo", "gangnam-gaepo-5-501");
    expect(floorplan?.unitKey).toBe("gangnam-gaepo-5-501");
    expect(floorplan?.sourcePdf).toContain("T&K개포");
  });

  it("does not resolve an unknown property or unit", async () => {
    expect(await getFloorplan("999", "84")).toBeNull();
    expect(await getFloorplan("gangnam-gaepo", "missing")).toBeNull();
  });
});
