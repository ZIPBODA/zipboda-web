import Image from "next/image";
import type { Subscription } from "@/entities/subscription";

export function SubscriptionMapResultCard({ item, active, onSelect }: { item: Subscription; active?: boolean; onSelect: () => void }) {
  return (
    <article data-housing-id={item.id} className={`relative rounded-xl px-3 py-5 md:py-6 ${active ? "bg-surface-secondary ring-2 ring-inset ring-brand" : "hover:bg-surface-secondary"}`}>
      <p className="text-xs font-medium text-fg-muted">{[item.agency, item.status].filter(Boolean).join(" · ")}</p>
      <div className="mt-2 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="break-keep text-base font-bold text-fg-heading">{item.title}</h3>
          <p className="mt-2 text-sm text-fg-muted">{item.location}</p>
        </div>
        {item.image && <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-tertiary"><Image src={item.image} alt="" fill sizes="80px" className="object-cover" /></div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-body">
        {item.sizes.length > 0 && <span>전용 {item.sizes[0]}{item.sizes.length > 1 ? `~${item.sizes[item.sizes.length - 1]}` : ""}㎡</span>}
        {item.households !== null && <span>총 {item.households}세대</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted">
        {item.deadline && <span>접수 마감 {item.deadline}</span>}
        {item.dday !== null && <span className="font-semibold text-fg-heading">{item.dday < 0 ? "마감" : item.dday === 0 ? "오늘 마감" : `D-${item.dday}`}</span>}
      </div>
      <button type="button" aria-label={`${item.title} 상세 보기`} aria-pressed={active ?? false} onClick={onSelect} className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" />
    </article>
  );
}
