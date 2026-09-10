import { describe, it, expect } from "vitest";
import { MOCK_FLOORPLANS } from "./__mocks__/floorplan.mock";
import { normalizeModel } from "../lib/normalize";

// 검수 화면 출력과 동일 스키마여야 하므로 목 모델도 정규화 게이트를 통과해야 한다
describe("MOCK_FLOORPLANS.model2d", () => {
  it("LH 33㎡ 목 모델은 검증 플래그 없이 자동 확정된다", () => {
    const model = MOCK_FLOORPLANS[0].model2d;
    expect(model).toBeDefined();
    if (!model) return;
    const result = normalizeModel(model);
    expect(result.flags).toEqual([]);
    expect(result.autoAccept).toBe(true);
  });
});
