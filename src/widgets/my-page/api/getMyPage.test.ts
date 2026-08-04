import { describe, it, expect } from "vitest";
import { getMyPage } from "./getMyPage";
import { getWishlist } from "./getWishlist";
import { getOrders } from "./getOrders";
import { getProfileEdit } from "./getProfileEdit";
import { MY_STATUS_BADGE, ORDER_STATUS_TONE } from "../config/constants";

describe("my-page api", () => {
  it("나의 청약: 프로필 통계 4종과 공고 3건", async () => {
    const { profile, listings } = await getMyPage();
    expect(profile.stats).toHaveLength(4);
    expect(listings).toHaveLength(3);
    listings.forEach((l) => expect(MY_STATUS_BADGE[l.status]).toBeTruthy());
  });

  it("찜 목록 3건, 각 항목 할인가 < 원가", async () => {
    const items = await getWishlist();
    expect(items).toHaveLength(3);
    items.forEach((i) => expect(i.price).toBeLessThan(i.originalPrice));
  });

  it("주문내역 3건, 모든 상태가 톤 맵에 존재", async () => {
    const items = await getOrders();
    expect(items).toHaveLength(3);
    items.forEach((o) => expect(ORDER_STATUS_TONE[o.status]).toBeTruthy());
  });

  it("프로필 수정 초기값: 이메일·닉네임 존재", async () => {
    const data = await getProfileEdit();
    expect(data.email).toContain("@");
    expect(data.nickname).toBeTruthy();
  });
});
