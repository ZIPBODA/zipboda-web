import { describe, it, expect } from "vitest";
import { HOUSING_NOTICES, HOUSING_SOURCE_DATA } from "./index";

// 주택이 늘어도 사람이 다시 훑지 않도록, 공고 데이터가 지켜야 할 규칙만 적어 둔다
describe("notice.json", () => {
  it("모든 주택에 공고가 하나씩 있다", () => {
    const ids = HOUSING_SOURCE_DATA.map((property) => property.id).sort();
    const noticeIds = HOUSING_NOTICES.map((notice) => notice.propertyId).sort();
    expect(noticeIds).toEqual(ids);
  });

  it("없는 주택을 가리키지 않는다", () => {
    const ids = new Set(HOUSING_SOURCE_DATA.map((property) => property.id));
    for (const notice of HOUSING_NOTICES) expect(ids.has(notice.propertyId)).toBe(true);
  });

  it("모집 인원은 공급 호수보다 적지 않다", () => {
    for (const notice of HOUSING_NOTICES) {
      expect(notice.supplyUnits).toBeGreaterThan(0);
      expect(notice.recruitCount).toBeGreaterThanOrEqual(notice.supplyUnits);
    }
  });

  it("일정은 공고 → 접수 시작 → 접수 마감 → 계약 순이다", () => {
    for (const notice of HOUSING_NOTICES) {
      expect(notice.postDate <= notice.applyStart).toBe(true);
      expect(notice.applyStart <= notice.applyEnd).toBe(true);
      expect(notice.applyEnd <= notice.contractDate).toBe(true);
      expect(notice.contractDate.slice(0, 7) <= notice.moveIn).toBe(true);
    }
  });

  it("날짜 형식을 지킨다", () => {
    for (const notice of HOUSING_NOTICES) {
      for (const date of [notice.postDate, notice.applyStart, notice.applyEnd, notice.contractDate]) {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(Date.parse(date))).toBe(false);
      }
      expect(notice.moveIn).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("접수를 시작하지 않은 공고에는 신청 건수가 없다", () => {
    for (const notice of HOUSING_NOTICES) {
      if (notice.applicationCount > 0) expect(notice.applyStart <= "2026-09-19").toBe(true);
    }
  });

  it("신청 페이지 주소는 https다", () => {
    for (const notice of HOUSING_NOTICES) expect(notice.applyUrl.startsWith("https://")).toBe(true);
  });
});
