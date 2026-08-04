import { describe, it, expect } from "vitest";
import { gradeFor } from "./score";
import { SCORE_FACTORS, MAX_TOTAL_SCORE } from "../config/constants";

describe("score", () => {
  it("각 요소의 최대치 합이 84점", () => {
    expect(SCORE_FACTORS.reduce((s, f) => s + f.max, 0)).toBe(MAX_TOTAL_SCORE);
  });

  it("기본 스텝 총점은 40점 (figma 135:2577)", () => {
    const total = SCORE_FACTORS.reduce((s, f) => s + f.steps[f.defaultStep].points, 0);
    expect(total).toBe(40);
  });

  it("각 요소의 마지막 스텝 가점 = 해당 요소 최대치", () => {
    SCORE_FACTORS.forEach((f) => expect(f.steps[f.steps.length - 1].points).toBe(f.max));
  });

  it("gradeFor: 경계값별 등급", () => {
    expect(gradeFor(0).label).toBe("낮음");
    expect(gradeFor(40).label).toBe("보통");
    expect(gradeFor(60).label).toBe("높음");
    expect(gradeFor(84).label).toBe("매우 높음");
  });
});
