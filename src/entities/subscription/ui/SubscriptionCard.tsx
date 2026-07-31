import Link from "next/link";
import { AgencyBadge } from "./AgencyBadge";
import { DdayBadge } from "./DdayBadge";
import type { Subscription } from "../model/types";

// figma 135:5598 공고 카드 — 카드 전체가 청약 상세 진입(별도 신청 CTA 없음, 외부 신청 전환)
export function SubscriptionCard({ item }: { item: Subscription }) {
  const stats: [string, string][] = [
    ["신청자", item.applicants.toLocaleString()],
    ["총 세대수", item.households.toLocaleString()],
    ["경쟁률", item.competition],
    ["입주", item.moveIn]
  ];
  return (
    <Link
      href={`/subscriptions/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full bg-surface-tertiary">
        <span className="absolute left-3 top-3">
          <AgencyBadge agency={item.agency} />
        </span>
        <span className="absolute right-3 top-3">
          <DdayBadge dday={item.dday} />
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-lg font-bold text-fg-strong">{item.title}</h3>
        <p className="text-xs text-fg-muted">{item.location}</p>
        <div className="flex flex-wrap gap-1">
          {item.sizes.map((s) => (
            <span key={s} className="rounded-full bg-surface-tertiary px-2 py-0.5 text-caption font-medium text-fg-muted">
              {s}㎡
            </span>
          ))}
        </div>
        <dl className="mt-2 grid grid-cols-4 gap-2 border-t border-line-subtle pt-3">
          {stats.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <dt className="text-caption text-fg-disabled">{k}</dt>
              <dd className="text-xs font-semibold text-fg-heading">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Link>
  );
}
