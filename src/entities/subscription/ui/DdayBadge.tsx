import { DDAY_URGENT_THRESHOLD } from "../config/constants";

// figma 135:5706 D-day 배지 64×64 r16 (D-7 이하 brand, 초과 gray)
export function DdayBadge({ dday }: { dday: number }) {
  const urgent = dday <= DDAY_URGENT_THRESHOLD;
  return (
    <span
      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-lg font-bold leading-none text-fg-heading ${
        urgent ? "bg-brand" : "bg-surface-tertiary"
      }`}
    >
      D-{dday}
    </span>
  );
}
