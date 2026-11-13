/** API가 준 날짜(YYYY-MM-DD)·달(YYYY-MM)을 화면 표기로 바꾼다 */

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
