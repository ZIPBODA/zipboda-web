import { AGENCY_BADGE_BG } from "../config/constants";
import type { AgencyCode } from "../model/types";

// figma 135:5673 공급기관 배지 44×44 r12
export function AgencyBadge({ agency }: { agency: AgencyCode }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-fg-ondark ${AGENCY_BADGE_BG[agency]}`}>
      {agency}
    </span>
  );
}
