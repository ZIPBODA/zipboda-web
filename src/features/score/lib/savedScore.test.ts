import { describe, it, expect, beforeEach } from "vitest";
import { loadSavedSteps, saveSteps } from "./savedScore";

const COUNTS = [3, 4, 5];

describe("savedScore", () => {
  beforeEach(() => window.localStorage.clear());

  it("저장한 값을 그대로 돌려준다", () => {
    expect(saveSteps([1, 2, 3])).toBe(true);
    expect(loadSavedSteps(COUNTS)).toEqual([1, 2, 3]);
  });

  it("저장한 적이 없으면 비어 있다", () => {
    expect(loadSavedSteps(COUNTS)).toBeNull();
  });

  it("항목 수가 달라졌으면 버린다 — 계산기가 바뀐 뒤의 옛 값이다", () => {
    saveSteps([1, 2]);
    expect(loadSavedSteps(COUNTS)).toBeNull();
  });

  it("범위를 벗어난 값은 버린다", () => {
    saveSteps([1, 2, 99]);
    expect(loadSavedSteps(COUNTS)).toBeNull();
  });

  it("깨진 값이 들어 있어도 터지지 않는다", () => {
    window.localStorage.setItem("zipboda.score.steps", "{ 망가진 값");
    expect(loadSavedSteps(COUNTS)).toBeNull();
  });
});
