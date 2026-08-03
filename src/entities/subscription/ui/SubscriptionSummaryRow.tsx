import Link from "next/link";
import { AgencyBadge } from "./AgencyBadge";
import { DdayBadge } from "./DdayBadge";
import type { Subscription } from "../model/types";

// figma 135:7088 메인 청약 요약 행 — 목록 카드(135:5669)보다 조밀하고 마감일 중심
export function SubscriptionSummaryRow({ item }: { item: Subscription }) {
  const stats: [string, string, string][] = [
    ["신청자", item.applicants.toLocaleString(), "font-semibold text-gray-800"],
    ["경쟁률", item.competition, "font-semibold text-gray-800"],
    ["마감일", item.deadline, "font-medium text-gray-700"]
  ];

  return (
    <Link
      href={`/subscriptions/${item.id}`}
      className="flex items-center gap-5 rounded-xl border border-line-subtle bg-surface p-5 transition-shadow hover:shadow-sm"
    >
      {/* 단지 이미지는 실 연동 전 플레이스홀더 */}
      <div className="h-[54px] w-[72px] shrink-0 rounded-lg bg-surface-tertiary" />
      <AgencyBadge agency={item.agency} size="lg" />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-fg-heading">{item.title}</h3>
        <p className="mt-0.5 text-sm text-fg-disabled">{item.location}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {item.sizes.map((size) => (
            <span key={size} className="rounded-full bg-surface-tertiary px-2.5 py-0.5 text-xs font-medium text-fg-body">
              {size}㎡
            </span>
          ))}
        </div>
      </div>

      <dl className="flex shrink-0 items-center">
        {stats.map(([label, value, valueTone]) => (
          <div key={label} className="flex flex-col items-center px-4">
            <dt className="text-xs text-fg-disabled">{label}</dt>
            <dd className={`mt-0.5 whitespace-nowrap text-sm ${valueTone}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <DdayBadge dday={item.dday} variant="tag" />
    </Link>
  );
}
