import Image from "next/image";
import Link from "next/link";
import { AgencyBadge } from "./AgencyBadge";
import { DdayBadge } from "./DdayBadge";
import type { Subscription } from "../model/types";

// figma 135:5669 공고 카드 — 가로형 리스트 행(이미지 좌측 + 본문). 카드 전체가 상세 진입(외부 신청 전환)
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
      className="flex items-stretch overflow-hidden rounded-xl border border-line-subtle bg-surface transition-shadow hover:shadow-md"
    >
      {/* figma 135:5670 이미지 컬럼(고정폭) */}
      <div className="relative w-48 shrink-0 bg-surface-tertiary">
        <Image src={item.image} alt="" fill sizes="192px" className="object-cover" />
      </div>
      <div className="flex flex-1 items-center gap-6 p-6">
        <AgencyBadge agency={item.agency} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-lg font-bold text-fg-heading">{item.title}</h3>
          <p className="mt-0.5 text-sm text-fg-disabled">{item.location}</p>
          <div className="mt-3 flex items-center gap-2">
            {item.sizes.map((s) => (
              <span key={s} className="rounded-full bg-surface-tertiary px-2.5 py-1 text-xs font-medium text-fg-body">
                {s}㎡
              </span>
            ))}
          </div>
        </div>
        <dl className="flex shrink-0 items-center gap-6">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col items-center">
              <dt className="text-xs text-fg-disabled">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
        <DdayBadge dday={item.dday} />
      </div>
    </Link>
  );
}
