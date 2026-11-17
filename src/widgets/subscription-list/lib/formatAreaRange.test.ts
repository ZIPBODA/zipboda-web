import { describe, expect, it } from "vitest";
import { formatAreaRange } from "./formatAreaRange";

describe("formatAreaRange", () => {
  it("평형이 없으면 적지 않는다", () => expect(formatAreaRange([])).toBeNull());
  it("하나면 그 값만", () => expect(formatAreaRange([24])).toBe("전용 24㎡"));
  it("여럿이면 처음과 끝을 잇는다", () => expect(formatAreaRange([13.66, 13.7, 13.86])).toBe("전용 13.66~13.86㎡"));
  it("소수 둘째 자리까지 보이고, 반올림해 같아지면 하나만 적는다", () => {
    expect(formatAreaRange([84.6192, 84.8159])).toBe("전용 84.62~84.82㎡");
    expect(formatAreaRange([59.9593, 59.9611])).toBe("전용 59.96㎡");
  });
});
