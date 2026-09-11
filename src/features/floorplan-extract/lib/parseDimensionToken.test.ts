import { describe, it, expect } from "vitest";
import { parseDimensionToken } from "./ocr";

describe("parseDimensionToken", () => {
  it("숫자로만 된 토큰을 치수로 인정한다", () => {
    expect(parseDimensionToken("3600")).toBe(3600);
    expect(parseDimensionToken(" 4500 ")).toBe(4500);
  });

  it("천 단위 쉼표를 허용한다", () => {
    expect(parseDimensionToken("10,040")).toBe(10040);
  });

  it("제목·면적·호수 토큰은 치수가 아니다", () => {
    expect(parseDimensionToken("51형")).toBeNull();
    expect(parseDimensionToken("51.93")).toBeNull();
    expect(parseDimensionToken("(180호)")).toBeNull();
    expect(parseDimensionToken("33.56㎡")).toBeNull();
  });

  it("빈 값·문자는 치수가 아니다", () => {
    expect(parseDimensionToken("")).toBeNull();
    expect(parseDimensionToken("abc")).toBeNull();
  });
});
