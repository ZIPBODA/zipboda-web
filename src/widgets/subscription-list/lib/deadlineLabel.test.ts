import { describe, expect, it } from "vitest";
import { deadlineLabel } from "./deadlineLabel";

describe("deadlineLabel", () => {
  it.each([[-1, "마감"], [0, "오늘 마감"], [1, "D-1"], [30, "D-30"]])("D%i → %s", (dday, label) => {
    expect(deadlineLabel(dday)).toBe(label);
  });
});
