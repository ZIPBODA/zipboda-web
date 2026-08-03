import { describe, it, expect } from "vitest";
import { getSubscriptionDetail } from "./getSubscriptionDetail";

describe("getSubscriptionDetail", () => {
  it("존재하는 공고는 상세를 반환한다", async () => {
    const detail = await getSubscriptionDetail("1");

    expect(detail?.title).toBe("광진 자양 LH 주택");
    expect(detail?.units.map((u) => u.size)).toEqual([59, 84, 114]);
    expect(detail?.applyUrl).toMatch(/^https:\/\//);
  });

  it("없는 공고는 null을 반환한다", async () => {
    expect(await getSubscriptionDetail("999")).toBeNull();
  });
});
