import { describe, it, expect } from "vitest";
import { getMyPage } from "./getMyPage";
import { MY_STATUS_BADGE } from "../config/constants";

describe("getMyPage", () => {
  it("프로필 통계 4종과 공고 3건을 반환", async () => {
    const { profile, listings } = await getMyPage();
    expect(profile.stats).toHaveLength(4);
    expect(listings).toHaveLength(3);
  });

  it("모든 공고 상태가 배지 맵에 존재", async () => {
    const { listings } = await getMyPage();
    listings.forEach((l) => expect(MY_STATUS_BADGE[l.status]).toBeTruthy());
  });
});
