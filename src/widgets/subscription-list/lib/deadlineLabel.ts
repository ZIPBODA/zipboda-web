/** 접수 마감까지 남은 날. 지난 공고는 D+가 아니라 '마감'으로 읽는 것이 자연스럽다 */
export function deadlineLabel(dday: number): string {
  if (dday < 0) return "마감";
  if (dday === 0) return "오늘 마감";
  return `D-${dday}`;
}
