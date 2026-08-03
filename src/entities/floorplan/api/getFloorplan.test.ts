import { describe, it, expect } from "vitest";
import { getFloorplan } from "./getFloorplan";

describe("getFloorplan", () => {
  it("공고·평형이 모두 맞을 때 평면도를 반환한다", async () => {
    const floorplan = await getFloorplan("1", 84);

    expect(floorplan?.rooms).toHaveLength(6);
    expect(floorplan?.rooms[0]).toEqual({ name: "거실 / 식당", dimensions: "5.2 × 4.8m", area: "24.96㎡" });
  });

  it("평면도가 없는 평형은 null을 반환한다", async () => {
    expect(await getFloorplan("1", 59)).toBeNull();
  });

  it("다른 공고의 평형으로는 조회되지 않는다", async () => {
    expect(await getFloorplan("2", 84)).toBeNull();
  });
});
