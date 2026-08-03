import { AGENCY_BADGE_BG } from "../config/constants";
import type { AgencyCode } from "../model/types";

// figma 135:5673(44) / 135:7091(48) 공급기관 배지 r12
const SIZE_CLASS = {
  md: "h-11 w-11 text-xs",
  lg: "h-12 w-12 text-sm"
} as const;

interface Props {
  agency: AgencyCode;
  size?: keyof typeof SIZE_CLASS;
}

export function AgencyBadge({ agency, size = "md" }: Props) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-fg-ondark ${SIZE_CLASS[size]} ${AGENCY_BADGE_BG[agency]}`}
    >
      {agency}
    </span>
  );
}
