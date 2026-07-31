import { Badge } from "@zipboda/ui";
import { DDAY_URGENT_THRESHOLD } from "../config/constants";

// figma 135:5598 DdayBadge — 마감 임박 시 brand 강조, 그 외 중립(공유 Badge 재사용 D4)
export function DdayBadge({ dday }: { dday: number }) {
  return <Badge variant={dday <= DDAY_URGENT_THRESHOLD ? "primary" : "neutral"}>D-{dday}</Badge>;
}
