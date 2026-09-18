import { describe, it, expect } from "vitest";
import { toMapMarker, toMapMarkers } from "./toMapMarker";

const gangnam = { id: "gangnam-gaepo", title: "강남개포동", coord: { lat: 37.47, lng: 127.05 } };

describe("toMapMarker", () => {
  it("좌표가 있으면 마커로 바꾼다", () => {
    expect(toMapMarker(gangnam)).toEqual({ id: "gangnam-gaepo", point: gangnam.coord, label: "강남개포동" });
  });

  it("좌표가 없으면 마커를 만들지 않는다", () => {
    expect(toMapMarker({ id: "x", title: "무좌표", coord: null })).toBeNull();
    expect(toMapMarker({ id: "x", title: "무좌표" })).toBeNull();
  });
});

describe("toMapMarkers", () => {
  it("좌표 없는 공고는 빼고 모은다", () => {
    const markers = toMapMarkers([gangnam, { id: "x", title: "무좌표", coord: null }]);
    expect(markers.map((marker) => marker.id)).toEqual(["gangnam-gaepo"]);
  });

  it("좌표가 하나도 없으면 빈 배열이다", () => {
    expect(toMapMarkers([{ id: "x", title: "무좌표", coord: null }])).toEqual([]);
  });
});
