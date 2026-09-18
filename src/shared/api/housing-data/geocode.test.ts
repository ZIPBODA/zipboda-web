import { describe, it, expect } from "vitest";
import { isInKorea } from "../../lib/geo";
import { HOUSING_GEOCODES, HOUSING_SOURCE_DATA } from "./index";

const propertyIds = new Set(HOUSING_SOURCE_DATA.map((property) => property.id));

// 좌표는 외부 API에서 받아 파일로 굳힌 것이라, 주택이 늘어도 같은 검사를 자동으로 받게 한다
describe("주택 좌표(geocode.json)", () => {
  it("없는 주택의 좌표가 섞여 있지 않다", () => {
    for (const entry of HOUSING_GEOCODES) expect(propertyIds.has(entry.propertyId), entry.propertyId).toBe(true);
  });

  it("주택당 좌표는 하나다", () => {
    const ids = HOUSING_GEOCODES.map((entry) => entry.propertyId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 좌표가 국내 범위 안이고 유한하다", () => {
    for (const entry of HOUSING_GEOCODES) {
      expect(Number.isFinite(entry.lat) && Number.isFinite(entry.lng), entry.propertyId).toBe(true);
      expect(isInKorea({ lat: entry.lat, lng: entry.lng }), entry.propertyId).toBe(true);
    }
  });

  it("출처를 알 수 있는 방법만 기록한다", () => {
    for (const entry of HOUSING_GEOCODES) {
      expect(["kakao-address", "manual"]).toContain(entry.method);
      expect(entry.queryAddress.length, entry.propertyId).toBeGreaterThan(0);
    }
  });
});
