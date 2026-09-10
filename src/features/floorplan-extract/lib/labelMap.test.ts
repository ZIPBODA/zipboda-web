import { describe, it, expect } from "vitest";
import { levenshtein, mapRoomLabel } from "./labelMap";

describe("levenshtein", () => {
  it("편집 거리를 계산한다", () => {
    expect(levenshtein("욕실", "욕실")).toBe(0);
    expect(levenshtein("욕싣", "욕실")).toBe(1);
    expect(levenshtein("abc", "xyz")).toBe(3);
  });
});

describe("mapRoomLabel", () => {
  it("정확한 라벨은 신뢰도 1", () => {
    expect(mapRoomLabel("거실")).toEqual({ label: "거실", confidence: 1 });
  });

  it("공백·구분자를 무시하고 매칭한다", () => {
    expect(mapRoomLabel("거 실")).toEqual({ label: "거실", confidence: 1 });
  });

  it("복합 라벨(주방/식당)은 우선순위가 높은 주방으로 부분 매칭한다", () => {
    const match = mapRoomLabel("주방/식당");
    expect(match.label).toBe("주방");
    expect(match.confidence).toBeLessThan(1);
  });

  it("OCR 오탈자 1글자는 오탈자 신뢰도로 매칭한다", () => {
    const match = mapRoomLabel("욕싣");
    expect(match.label).toBe("욕실");
    expect(match.confidence).toBe(0.6);
  });

  it("발코니1처럼 숫자가 붙어도 부분 매칭한다", () => {
    expect(mapRoomLabel("발코니1").label).toBe("발코니");
  });

  it("모르는 텍스트·빈 문자열은 기타", () => {
    expect(mapRoomLabel("xyz").label).toBe("기타");
    expect(mapRoomLabel("").label).toBe("기타");
  });
});
