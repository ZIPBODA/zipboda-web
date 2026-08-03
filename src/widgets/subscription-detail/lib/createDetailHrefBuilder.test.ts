import { describe, it, expect } from "vitest";
import { createDetailHrefBuilder } from "./createDetailHrefBuilder";

const base = { id: "1", defaultUnitSize: 84, unit: 84, view: "2D", viewpoint: "1인칭" } as const;

describe("createDetailHrefBuilder", () => {
  it("기본 상태에서는 쿼리 없이 상세 경로만 반환한다", () => {
    expect(createDetailHrefBuilder({ ...base })({})).toBe("/subscriptions/1");
  });

  it("기본값과 다른 평형은 쿼리에 담는다", () => {
    expect(createDetailHrefBuilder({ ...base })({ unit: 59 })).toBe("/subscriptions/1?unit=59");
  });

  it("3D 전환 시 view 쿼리를 붙인다", () => {
    expect(createDetailHrefBuilder({ ...base })({ view: "3D" })).toBe("/subscriptions/1?view=3D");
  });

  it("현재 선택 상태를 유지한 채 일부만 변경한다", () => {
    const href = createDetailHrefBuilder({ ...base, unit: 59, view: "3D" })({ viewpoint: "3인칭" });
    const query = new URL(href, "http://localhost").searchParams;

    expect(query.get("unit")).toBe("59");
    expect(query.get("view")).toBe("3D");
    expect(query.get("viewpoint")).toBe("3인칭");
  });

  it("기본 평형으로 되돌리면 unit 쿼리를 제거한다", () => {
    expect(createDetailHrefBuilder({ ...base, unit: 59 })({ unit: 84 })).toBe("/subscriptions/1");
  });
});
