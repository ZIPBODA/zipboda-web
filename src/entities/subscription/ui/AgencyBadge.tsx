import { AGENCY_BADGE_CLASS } from "../config/constants";
import type { AgencyCode } from "../model/types";

// figma 135:5598 ProviderBadge (LH/SH/GH/IH)
export function AgencyBadge({ agency }: { agency: AgencyCode }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold leading-none ${AGENCY_BADGE_CLASS[agency]}`}>
      {agency}
    </span>
  );
}
