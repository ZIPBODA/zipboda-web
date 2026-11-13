import { describe, it, expect } from "vitest";
import { formatApplyPeriod, formatNoticeDate, formatNoticeMonth } from "./noticeSchedule";

describe("표기", () => {
  it("날짜는 앞자리 0을 떼고 읽는다", () => {
    expect(formatNoticeDate("2026-09-01")).toBe("2026년 9월 1일");
  });

  it("입주는 달까지만 쓴다", () => {
    expect(formatNoticeMonth("2027-01")).toBe("2027년 1월");
  });

  it("신청 기간은 시작과 끝을 함께 보여준다", () => {
    expect(formatApplyPeriod({ applyStart: "2026-09-14", applyEnd: "2026-09-22" })).toBe("2026.09.14 ~ 2026.09.22");
  });
});
