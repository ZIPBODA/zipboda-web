import { DDAY_URGENT_THRESHOLD } from "../config/constants";

/**
 * figma 135:5706 타일형(목록 64×64 r16) / 135:7118·135:7152 태그형(메인 padding 12·20 r12).
 * D-7 이하는 brand 강조. 태그형은 마감 여유가 있으면 텍스트까지 흐리게 처리한다.
 */
const VARIANT_CLASS = {
  tile: "h-16 w-16 flex-col items-center justify-center rounded-xl text-lg leading-none",
  tag: "px-5 py-3 rounded-lg text-sm"
} as const;

interface Props {
  dday: number | null;
  variant?: keyof typeof VARIANT_CLASS;
}

export function DdayBadge({ dday, variant = "tile" }: Props) {
  if (dday === null) return null;
  const urgent = dday <= DDAY_URGENT_THRESHOLD;
  const tone =
    variant === "tag"
      ? urgent
        ? "bg-brand text-fg-strong"
        : "bg-surface-tertiary text-fg-disabled"
      : `text-fg-heading ${urgent ? "bg-brand" : "bg-surface-tertiary"}`;

  return <span className={`flex shrink-0 font-bold ${VARIANT_CLASS[variant]} ${tone}`}>D-{dday}</span>;
}
