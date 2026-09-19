import { describe, it, expect } from "vitest";
import { createListViewHrefBuilder } from "./createListViewHrefBuilder";

describe("createListViewHrefBuilder", () => {
  it("기본 보기는 쿼리에 남기지 않는다", () => {
    expect(createListViewHrefBuilder({})("list")).toBe("/subscriptions");
  });

  it("지도 보기는 쿼리로 드러낸다", () => {
    expect(createListViewHrefBuilder({})("map")).toBe("/subscriptions?view=map");
  });

  it("적용한 필터를 그대로 들고 간다", () => {
    const href = createListViewHrefBuilder({ region: "서울", agency: "LH" })("map");
    expect(href).toContain("region=%EC%84%9C%EC%9A%B8");
    expect(href).toContain("agency=LH");
    expect(href).toContain("view=map");
  });

  it("지도에서 목록으로 돌아올 때도 필터를 지키고 view만 뺀다", () => {
    expect(createListViewHrefBuilder({ agency: "SH", view: "map" })("list")).toBe("/subscriptions?agency=SH");
  });

  it("빈 값은 쿼리에 넣지 않는다", () => {
    expect(createListViewHrefBuilder({ region: "", size: undefined })("list")).toBe("/subscriptions");
  });
});
