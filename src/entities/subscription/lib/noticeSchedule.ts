import type { SubscriptionStatus } from "../model/types";

/**
 * 공고 일정을 화면이 쓰는 값으로 바꾼다.
 * 오늘 날짜를 밖에서 받는다 — 달력을 함수 안에서 읽으면 테스트가 날마다 결과를 바꾼다.
 */

/** YYYY-MM-DD를 자정 UTC로 읽는다. 시차로 하루가 밀리지 않게 시각을 버린다 */
const atMidnight = (isoDate: string): number => Date.parse(`${isoDate}T00:00:00Z`);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (today: Date): number =>
  Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

/** 오늘부터 그날까지 남은 날. 오늘이면 0, 지났으면 음수 */
export const daysUntil = (isoDate: string, today: Date): number =>
  Math.round((atMidnight(isoDate) - startOfDay(today)) / MS_PER_DAY);

export const noticeStatus = (period: { applyStart: string; applyEnd: string }, today: Date): SubscriptionStatus => {
  if (daysUntil(period.applyStart, today) > 0) return "접수예정";
  return daysUntil(period.applyEnd, today) < 0 ? "마감" : "접수중";
};

/** 마감일까지 남은 날. 이미 끝났거나 아직 열리지 않았으면 배지를 달지 않는다 */
export const noticeDday = (period: { applyStart: string; applyEnd: string }, today: Date): number | null =>
  noticeStatus(period, today) === "접수중" ? daysUntil(period.applyEnd, today) : null;

export const formatNoticeDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
};

export const formatNoticeMonth = (isoMonth: string): string => {
  const [year, month] = isoMonth.split("-");
  return `${year}년 ${Number(month)}월`;
};

const dotted = (isoDate: string) => isoDate.replace(/-/g, ".");

export const formatApplyPeriod = (period: { applyStart: string; applyEnd: string }): string =>
  `${dotted(period.applyStart)} ~ ${dotted(period.applyEnd)}`;

/**
 * 공급 호수 한 자리를 몇 명이 놓고 겨뤘는지. 공공주택 공고가 쓰는 계산과 같다.
 * 나누어떨어지면 소수점을 붙이지 않는다 — 691.0:1은 읽기에 군더더기다.
 */
export const formatCompetition = (applicationCount: number, supplyUnits: number): string | null => {
  if (supplyUnits <= 0) return null;
  const rate = applicationCount / supplyUnits;
  return `${Number.isInteger(rate) ? rate : rate.toFixed(1)}:1`;
};
