import { describe, expect, it } from "vitest";
import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { getFeaturedFloorplans } from "./getFeaturedFloorplans";
import { HOUSING_FLOORPLANS } from "./housingFloorplans";

describe("홈 대표 평면도", () => {
  it("지정 주택의 검수된 호실과 원본 이미지를 연결한다", async () => {
    const items = await getFeaturedFloorplans();
    expect(items).toHaveLength(3);
    for (const item of items) {
      const url = new URL(item.href!, "https://zipboda.test");
      const plan = HOUSING_FLOORPLANS.find((p) => p.unitKey === url.searchParams.get("unit"));
      expect(plan?.has3d).toBe(true);
      expect(plan?.image2dUrl).toBe(item.image);
      expect(url.pathname).toBe(`/subscriptions/${plan?.subscriptionId}/floorplan`);
      expect(HOUSING_SOURCE_DATA.some((p) => p.id === plan?.subscriptionId && p.title === item.title)).toBe(true);
    }
  });
});
