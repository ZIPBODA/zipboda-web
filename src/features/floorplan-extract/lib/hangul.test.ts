import { describe, it, expect } from "vitest";
import { decomposeHangul } from "./hangul";
import { levenshtein } from "./labelMap";

describe("decomposeHangul", () => {
  it("음절을 초성·중성·종성으로 편다", () => {
    expect(decomposeHangul("현관")).toBe("ㅎㅕㄴㄱㅘㄴ");
    expect(decomposeHangul("욕실")).toBe("ㅇㅛㄱㅅㅣㄹ");
  });

  it("받침이 없으면 종성 자리를 비운다", () => {
    expect(decomposeHangul("주방")).toBe("ㅈㅜㅂㅏㅇ");
    expect(decomposeHangul("혀과")).toBe("ㅎㅕㄱㅘ");
  });

  it("한글이 아닌 글자는 그대로 둔다", () => {
    expect(decomposeHangul("발코니1")).toBe("ㅂㅏㄹㅋㅗㄴㅣ1");
    expect(decomposeHangul("bath")).toBe("bath");
  });

  it("빈 문자열은 그대로", () => {
    expect(decomposeHangul("")).toBe("");
  });
});

describe("자모 단위 거리", () => {
  it("받침이 빠진 OCR 오류는 자모로 보면 가깝다", () => {
    // 글자 단위로는 2글자 모두 다르지만 자모로는 ㄴ 두 개 차이
    expect(levenshtein("혀과", "현관")).toBe(2);
    expect(levenshtein(decomposeHangul("혀과"), decomposeHangul("현관"))).toBe(2);
    expect(levenshtein(decomposeHangul("혀과"), decomposeHangul("현관")) / decomposeHangul("현관").length).toBeLessThan(0.4);
  });

  it("서로 다른 방 이름은 자모로 펴도 멀다", () => {
    expect(levenshtein(decomposeHangul("욕실"), decomposeHangul("거실"))).toBeGreaterThan(2);
    expect(levenshtein(decomposeHangul("주방"), decomposeHangul("안방"))).toBeGreaterThan(2);
    expect(levenshtein(decomposeHangul("침실"), decomposeHangul("거실"))).toBeGreaterThan(2);
  });
});
