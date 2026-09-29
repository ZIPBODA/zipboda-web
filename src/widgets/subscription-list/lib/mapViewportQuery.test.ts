import { describe, expect, it } from "vitest";
import { readMapViewport, writeMapViewport } from "./mapViewportQuery";

const query = (search: string) => new URLSearchParams(search);

describe("지도 위치 쿼리", () => {
  it("중심과 확대 단계를 읽는다", () => {
    expect(readMapViewport(query("lat=37.5665&lng=126.978&zoom=5"))).toEqual({ center: { lat: 37.5665, lng: 126.978 }, level: 5 });
  });

  it.each([
    ["하나라도 없으면", "lat=37.5&zoom=5"],
    ["빈 값이면", "lat=&lng=127&zoom=5"],
    ["숫자가 아니면", "lat=abc&lng=127&zoom=5"],
    ["국내가 아니면", "lat=48.85&lng=2.35&zoom=5"],
    ["확대 단계가 범위 밖이면", "lat=37.5&lng=127&zoom=15"],
    ["확대 단계가 정수가 아니면", "lat=37.5&lng=127&zoom=4.5"]
  ])("%s 없는 것으로 보고 공고 전체에 맞춘다", (_, search) => {
    expect(readMapViewport(query(search))).toBeNull();
  });

  it("다른 쿼리는 그대로 두고 위치만 약 1m 단위로 적는다", () => {
    const next = writeMapViewport(query("region=서울&view=map"), { center: { lat: 37.566535123, lng: 126.9779692 }, level: 6 });
    expect(next.get("region")).toBe("서울");
    expect(next.get("view")).toBe("map");
    expect(next.get("lat")).toBe("37.56654");
    expect(next.get("lng")).toBe("126.97797");
    expect(next.get("zoom")).toBe("6");
  });

  it("쓴 것을 다시 읽으면 같은 자리다", () => {
    const viewport = { center: { lat: 37.5, lng: 127.1 }, level: 3 };
    expect(readMapViewport(writeMapViewport(query(""), viewport))).toEqual(viewport);
  });
});
