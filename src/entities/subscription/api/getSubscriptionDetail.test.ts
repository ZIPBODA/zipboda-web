import { describe, it, expect } from "vitest";
import { getSubscriptionDetail } from "./getSubscriptionDetail";

describe("getSubscriptionDetail", () => {
  it("returns a catalog property with stable layout keys", async () => {
    const detail = await getSubscriptionDetail("gangnam-gaepo");
    expect(detail?.title).toBe("강남개포동(T&K개포)");
    expect(detail?.units.length).toBeGreaterThan(0);
    expect(detail?.units.every((unit) => Boolean(unit.unitKey))).toBe(true);
  });

  it("returns null for an unknown property", async () => {
    expect(await getSubscriptionDetail("999")).toBeNull();
  });
});
