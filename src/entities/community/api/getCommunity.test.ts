import { describe, it, expect } from "vitest";
import { getCommunityPosts, getCommunityHero } from "./getCommunity";

describe("getCommunity", () => {
  it("전체(또는 미지정)는 게시글 3건", async () => {
    expect(await getCommunityPosts()).toHaveLength(3);
    expect(await getCommunityPosts("전체")).toHaveLength(3);
  });

  it("카테고리 필터: 가구 1건", async () => {
    const list = await getCommunityPosts("가구");
    expect(list).toHaveLength(1);
    expect(list[0].category).toBe("가구");
  });

  it("인기글 히어로 반환", async () => {
    const hero = await getCommunityHero();
    expect(hero.title).toContain("청약");
  });
});
