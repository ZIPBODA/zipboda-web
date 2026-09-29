import Image from "next/image";
import type { Subscription } from "@/entities/subscription";
import { cn } from "@/shared/ui";
import { deadlineLabel } from "../lib/deadlineLabel";
import { formatAreaRange } from "../lib/formatAreaRange";
import { DeadlineTag } from "./DeadlineTag";

/**
 * 모바일에서는 회색 시트 위 흰 카드로 서고 주택명을 크게, 마감은 색 태그로 보인다.
 * 지도에서 고른 카드에는 누를 곳이 한눈에 보이도록 '상세 보기' 버튼 모양을 덧댄다 — 실제로 누르는 것은 카드 전체다.
 */
export function SubscriptionMapResultCard({ item, active, onSelect, showCta = false }: { item: Subscription; active?: boolean; onSelect: () => void; showCta?: boolean }) {
  return (
    <article data-housing-id={item.id} className={cn("relative rounded-xl px-3 py-5 max-md:rounded-2xl max-md:bg-surface max-md:p-5 md:py-6", active ? "bg-surface-secondary ring-2 ring-inset ring-brand" : "hover:bg-surface-secondary")}>
      <p className="text-xs font-medium text-fg-muted">{[item.agency, item.status].filter(Boolean).join(" · ")}</p>
      <div className="mt-2 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="break-keep text-base font-bold text-fg-heading max-md:text-lg">{item.title}</h3>
          <p className="mt-2 text-sm text-fg-muted max-md:line-clamp-1">{item.location}</p>
        </div>
        {item.image && <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-tertiary"><Image src={item.image} alt="" fill sizes="80px" className="object-cover" /></div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-body">
        {item.sizes.length > 0 && <span>{formatAreaRange(item.sizes)}</span>}
        {item.households !== null && <span>총 {item.households}세대</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted max-md:hidden">
        {item.deadline && <span>접수 마감 {item.deadline}</span>}
        {item.dday !== null && <span className="font-semibold text-fg-heading">{deadlineLabel(item.dday)}</span>}
      </div>
      <DeadlineTag dday={item.dday} deadline={item.deadline} className="mt-3 md:hidden" />
      {showCta && <span aria-hidden className="mt-4 flex h-11 items-center justify-center rounded-lg bg-surface-tertiary text-sm font-semibold text-fg-heading md:hidden">상세 보기</span>}
      <button type="button" aria-label={`${item.title} 상세 보기`} aria-pressed={active ?? false} onClick={onSelect} className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand max-md:rounded-2xl" />
    </article>
  );
}
