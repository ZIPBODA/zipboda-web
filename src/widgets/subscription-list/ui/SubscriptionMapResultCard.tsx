import Link from "next/link";
import Image from "next/image";
import type { Subscription } from "@/entities/subscription";

export function SubscriptionMapResultCard({ item }: { item: Subscription }) {
  return (
    <article data-housing-id={item.id} className="px-5 py-5 md:py-6">
      <p className="text-xs font-medium text-fg-muted">{[item.agency, item.status].filter(Boolean).join(" · ")}</p>
      <div className="mt-2 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="break-keep text-base font-bold text-fg-heading">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.location}</p>
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
      <Link href={`/subscriptions/${encodeURIComponent(item.id)}`} className="mt-2 flex min-h-11 items-center justify-end text-sm font-semibold text-fg-heading">상세 보기 →</Link>
    </article>
  );
}
