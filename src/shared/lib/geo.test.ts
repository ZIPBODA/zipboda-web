import { describe, it, expect } from "vitest";
import { boundsOf, centerOf, isInKorea } from "./geo";

const seoul = { lat: 37.5665, lng: 126.978 };
const busan = { lat: 35.1796, lng: 129.0756 };

describe("boundsOf", () => {
  it("점이 없으면 범위도 없다", () => {
    expect(boundsOf([])).toBeNull();
  });

  it("점이 하나면 네 변이 그 점에 붙는다", () => {
    expect(boundsOf([seoul])).toEqual({ south: seoul.lat, west: seoul.lng, north: seoul.lat, east: seoul.lng });
  });

  it("여러 점을 모두 감싼다", () => {
    expect(boundsOf([seoul, busan])).toEqual({ south: busan.lat, west: seoul.lng, north: seoul.lat, east: busan.lng });
  });
});

describe("centerOf", () => {
  it("점이 없으면 중심도 없다", () => {
    expect(centerOf([])).toBeNull();
  });

  it("두 점의 가운데를 돌려준다", () => {
    const center = centerOf([seoul, busan]);
    expect(center?.lat).toBeCloseTo((seoul.lat + busan.lat) / 2);
    expect(center?.lng).toBeCloseTo((seoul.lng + busan.lng) / 2);
  });
});

describe("isInKorea", () => {
  it("국내 좌표를 통과시킨다", () => {
    expect(isInKorea(seoul)).toBe(true);
    expect(isInKorea(busan)).toBe(true);
  });

  it("위경도가 뒤바뀐 좌표를 걸러낸다", () => {
    expect(isInKorea({ lat: seoul.lng, lng: seoul.lat })).toBe(false);
  });

  it("국외 좌표를 걸러낸다", () => {
    expect(isInKorea({ lat: 35.6762, lng: 139.6503 })).toBe(false);
  });
});
