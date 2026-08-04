import { describe, it, expect } from "vitest";
import { getInspirations } from "./getInspirations";

describe("getInspirations", () => {
  it("전체(또는 미지정)는 9건", async () => {
    expect(await getInspirations()).toHaveLength(9);
    expect(await getInspirations("전체")).toHaveLength(9);
  });

  it("카테고리 필터: 거실 3건", async () => {
    const list = await getInspirations("거실");
    expect(list).toHaveLength(3);
    expect(list.every((i) => i.category === "거실")).toBe(true);
  });
});
