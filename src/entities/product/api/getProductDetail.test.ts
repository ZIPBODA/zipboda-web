import { describe, it, expect } from "vitest";
import { getProductDetail } from "./getProductDetail";

describe("getProductDetail", () => {
  it("존재하는 id는 상세 반환(린넨 침대 프레임 s2)", async () => {
    const p = await getProductDetail("s2");
    expect(p?.name).toBe("린넨 침대 프레임");
    expect(p?.rating).toBe(4.9);
    expect(p?.colors.length).toBe(4);
    expect(p?.description).toContain("린넨");
  });

  it("없는 id는 null", async () => {
    expect(await getProductDetail("nope")).toBeNull();
  });
});
