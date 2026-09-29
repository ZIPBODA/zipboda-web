import { describe, it, expect } from "vitest";
import { createListViewHrefBuilder } from "./createListViewHrefBuilder";

describe("createListViewHrefBuilder", () => {
  it("첫 화면인 지도는 쿼리에 남기지 않는다", () => {
    expect(createListViewHrefBuilder({})("map")).toBe("/subscriptions");
  });

  it("목록 보기는 쿼리로 드러낸다", () => {
    expect(createListViewHrefBuilder({})("list")).toBe("/subscriptions?view=list");
  });

  it("적용한 필터와 지도 위치를 그대로 들고 간다 — 목록에 다녀와도 보던 지도로 돌아온다", () => {
    const href = createListViewHrefBuilder({ region: "서울", agency: "LH", lat: "37.5", lng: "127", zoom: "5" })("list");
    expect(href).toContain("region=%EC%84%9C%EC%9A%B8");
    expect(href).toContain("agency=LH");
    expect(href).toContain("lat=37.5&lng=127&zoom=5");
    expect(href).toContain("view=list");
  });

  it("목록에서 지도로 돌아갈 때도 필터를 지키고 view만 뺀다", () => {
    expect(createListViewHrefBuilder({ agency: "SH", view: "list" })("map")).toBe("/subscriptions?agency=SH");
  });

  it("예전 view=map 링크에서 목록으로 가도 view는 하나만 남는다", () => {
    expect(createListViewHrefBuilder({ view: "map" })("list")).toBe("/subscriptions?view=list");
  });

  it("빈 값은 쿼리에 넣지 않는다", () => {
    expect(createListViewHrefBuilder({ region: "", size: undefined })("map")).toBe("/subscriptions");
  });
});
