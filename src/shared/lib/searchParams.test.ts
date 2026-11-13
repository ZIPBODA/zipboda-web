import { describe, expect, it } from "vitest";
import { firstParam } from "./searchParams";

describe("firstParam", () => {
  it("여러 번 온 값은 첫 값, 한 번 온 값은 그대로, 없으면 undefined다", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam("a")).toBe("a");
    expect(firstParam(undefined)).toBeUndefined();
    expect(firstParam([])).toBeUndefined();
  });
});
