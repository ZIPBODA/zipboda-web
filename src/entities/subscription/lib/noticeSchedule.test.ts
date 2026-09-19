import { describe, it, expect } from "vitest";
import {
  daysUntil,
  formatApplyPeriod,
  formatCompetition,
  formatNoticeDate,
  formatNoticeMonth,
  noticeDday,
  noticeStatus
} from "./noticeSchedule";

// 오늘을 고정해 둔다 — 실제 달력을 쓰면 같은 테스트가 날마다 다른 답을 낸다
const TODAY = new Date("2026-09-19T13:40:00+09:00");

describe("daysUntil", () => {
  it("같은 날은 0이다", () => {
    expect(daysUntil("2026-09-19", TODAY)).toBe(0);
  });

  it("시각이 늦어도 날짜만 센다", () => {
    expect(daysUntil("2026-09-22", new Date("2026-09-19T23:59:00+09:00"))).toBe(3);
  });

  it("지난 날은 음수로 돌려준다", () => {
    expect(daysUntil("2026-09-11", TODAY)).toBe(-8);
  });

  it("달을 넘어가도 센다", () => {
    expect(daysUntil("2026-10-16", TODAY)).toBe(27);
  });
});

describe("noticeStatus", () => {
  it("접수 시작 전이면 접수예정", () => {
    expect(noticeStatus({ applyStart: "2026-09-21", applyEnd: "2026-10-07" }, TODAY)).toBe("접수예정");
  });

  it("접수 기간 안이면 접수중", () => {
    expect(noticeStatus({ applyStart: "2026-09-14", applyEnd: "2026-09-22" }, TODAY)).toBe("접수중");
  });

  it("마감 당일까지는 접수중이다", () => {
    expect(noticeStatus({ applyStart: "2026-09-10", applyEnd: "2026-09-19" }, TODAY)).toBe("접수중");
  });

  it("마감일이 지나면 마감", () => {
    expect(noticeStatus({ applyStart: "2026-09-07", applyEnd: "2026-09-11" }, TODAY)).toBe("마감");
  });
});

describe("noticeDday", () => {
  it("접수중일 때만 남은 날을 센다", () => {
    expect(noticeDday({ applyStart: "2026-09-14", applyEnd: "2026-09-22" }, TODAY)).toBe(3);
  });

  it("마감한 공고는 배지를 달지 않는다", () => {
    expect(noticeDday({ applyStart: "2026-09-07", applyEnd: "2026-09-11" }, TODAY)).toBeNull();
  });

  it("아직 열리지 않은 공고도 배지를 달지 않는다", () => {
    expect(noticeDday({ applyStart: "2026-09-21", applyEnd: "2026-10-07" }, TODAY)).toBeNull();
  });
});

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

describe("formatCompetition", () => {
  it("나누어떨어지면 소수점을 붙이지 않는다", () => {
    expect(formatCompetition(691, 1)).toBe("691:1");
  });

  it("나머지가 있으면 소수 한 자리로 줄인다", () => {
    expect(formatCompetition(850, 18)).toBe("47.2:1");
  });

  it("공급 호수가 없으면 경쟁률을 만들지 않는다", () => {
    expect(formatCompetition(100, 0)).toBeNull();
  });
});
