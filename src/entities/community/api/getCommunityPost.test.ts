import { describe, it, expect } from "vitest";
import { getCommunityPost } from "./getCommunityPost";

describe("getCommunityPost", () => {
  it("존재하는 id는 상세 반환(거실 꾸미기)", async () => {
    const p = await getCommunityPost("1");
    expect(p?.title).toContain("거실 꾸미기");
    expect(p?.body.length).toBe(3);
    expect(p?.comments.length).toBe(3);
  });

  it("없는 id는 null", async () => {
    expect(await getCommunityPost("nope")).toBeNull();
  });
});
