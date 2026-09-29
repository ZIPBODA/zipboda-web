import { DDAY_URGENT_THRESHOLD } from "@/entities/subscription";
import { cn } from "@/shared/ui";
import { deadlineLabel } from "../lib/deadlineLabel";

/** 마감이 가까운 공고만 브랜드 색으로 드러낸다. 지난 공고는 흐리게 둔다 */
function tone(dday: number | null) {
  if (dday === null || DDAY_URGENT_THRESHOLD < dday) return "bg-surface-tertiary text-fg-body";
  if (dday < 0) return "bg-surface-tertiary text-fg-muted";
  return "bg-amber-100 text-brand-dark";
}

export function DeadlineTag({ dday, deadline, className }: { dday: number | null; deadline: string | null; className?: string }) {
  const parts = [dday === null ? null : deadlineLabel(dday), deadline && `${deadline} 마감`].filter(Boolean);
  if (parts.length === 0) return null;
  return <span className={cn("inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold", tone(dday), className)}>{parts.join(" · ")}</span>;
}
