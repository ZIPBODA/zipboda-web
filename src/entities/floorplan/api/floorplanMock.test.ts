import { describe, it, expect } from "vitest";
import { MOCK_FLOORPLANS } from "./__mocks__/floorplan.mock";
import { normalizeModel } from "../lib/normalize";

/**
 * 목 모델은 사람이 옮겨 적은 값이 아니라 추출 파이프라인이 도면 이미지로 만든 결과다.
 * 그래서 "플래그 0건"을 요구하지 않는다(실제 추출에는 검수 플래그가 남는다).
 * 대신 뷰어가 3D로 세울 수 있는 형태인지, 그리고 이미지에서 나온 값인지를 지킨다.
 */
describe("MOCK_FLOORPLANS.model2d (파이프라인 출력)", () => {
  const model = MOCK_FLOORPLANS[0].model2d;

  it("뷰어가 쓸 모델이 들어 있다", () => {
    expect(model).toBeDefined();
  });

  it("스케일은 도면에 인쇄된 치수 체인에서 나온다", () => {
    expect(model?.scale.source).toBe("dimension-chain");
    expect(model?.printed.dimensionChains[0]?.values.length).toBeGreaterThan(1);
  });

  it("3D를 세우는 데 필요한 구성요소를 갖췄다", () => {
    if (!model) return;
    expect(model.outline.length).toBeGreaterThanOrEqual(4);
    expect(model.rooms.length).toBeGreaterThan(0);
    expect(model.walls.length).toBeGreaterThan(0);
    expect(model.openings.length).toBeGreaterThan(0);
  });

  it("개구부는 모두 실재하는 벽 위에 있다", () => {
    if (!model) return;
    const wallIds = new Set(model.walls.map((w) => w.id));
    for (const opening of model.openings) expect(wallIds.has(opening.wallId)).toBe(true);
  });

  it("정규화를 통과하며 검수 상태를 판정할 수 있다", () => {
    if (!model) return;
    const result = normalizeModel(model);
    expect(result.model.rooms.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(typeof result.autoAccept).toBe("boolean");
  });
});
