import { describe, it, expect } from "vitest";
import { matchesSizeRange } from "./matchesSizeRange";

describe("matchesSizeRange", () => {
  it("전체는 아무 조건도 걸지 않는다", () => {
    expect(matchesSizeRange([], "전체")).toBe(true);
  });

  it("소수점이 붙은 면적도 구간으로 잡는다", () => {
    expect(matchesSizeRange([14.6475], "0-15")).toBe(true);
    expect(matchesSizeRange([23.225], "20-25")).toBe(true);
  });

  it("평형이 여러 개면 하나만 걸려도 공고가 남는다", () => {
    expect(matchesSizeRange([26.99, 30.76], "30-")).toBe(true);
  });

  it("경계는 왼쪽만 포함해 두 구간에 겹치지 않는다", () => {
    expect(matchesSizeRange([20], "15-20")).toBe(false);
    expect(matchesSizeRange([20], "20-25")).toBe(true);
  });

  it("마지막 구간은 위가 열려 있다", () => {
    expect(matchesSizeRange([120], "30-")).toBe(true);
  });

  it("면적을 모르는 공고는 어떤 구간에도 걸리지 않는다", () => {
    expect(matchesSizeRange([], "0-15")).toBe(false);
  });

  it("예전 링크의 값은 조건으로 삼지 않는다", () => {
    expect(matchesSizeRange([14.69], "39")).toBe(true);
  });
});
