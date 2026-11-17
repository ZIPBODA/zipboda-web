import { describe, expect, it } from "vitest";
import { formatArea, formatAreaValue, sizeChipLabelsOf } from "./formatArea";

describe("면적 표기", () => {
  it("소수 둘째 자리까지 반올림하고 끝자리 0은 떼어 낸다", () => {
    expect(formatAreaValue(84.6192)).toBe("84.62");
    expect(formatAreaValue(14.6475)).toBe("14.65");
    expect(formatAreaValue(16.3)).toBe("16.3");
    expect(formatAreaValue(59)).toBe("59");
    expect(formatArea(84.8159)).toBe("84.82㎡");
  });

  it("칩은 넷까지 보이고 나머지는 '+n' 하나로 줄인다", () => {
    expect(sizeChipLabelsOf([16.3, 23.19, 26.64, 36.34])).toEqual(["16.3㎡", "23.19㎡", "26.64㎡", "36.34㎡"]);
    expect(sizeChipLabelsOf([16.3, 23.19, 26.64, 36.34, 36.39, 36.44])).toEqual(["16.3㎡", "23.19㎡", "26.64㎡", "36.34㎡", "+2"]);
    expect(sizeChipLabelsOf([])).toEqual([]);
  });

  it("반올림해 같아진 면적은 칩 하나다", () => {
    expect(sizeChipLabelsOf([59.9593, 59.9611, 84.6192])).toEqual(["59.96㎡", "84.62㎡"]);
  });
});
