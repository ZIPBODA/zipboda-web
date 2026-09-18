import Image from "next/image";
import Link from "next/link";
import { AGENCY_BADGE_BG, DDAY_URGENT_THRESHOLD } from "../config/constants";
import type { Subscription } from "../model/types";

// figma 419:10136 모바일 공고 카드 — 세로형(이미지배경 헤더 + 오버레이 텍스트/배지 + 하단 통계 4)
export function SubscriptionCardMobile({ item }: { item: Subscription }) {
  const urgent = item.dday !== null && item.dday <= DDAY_URGENT_THRESHOLD;
  const stats: [string, string][] = [
    ["마감일", item.deadline ?? ""],
    ["세대", item.households?.toLocaleString() ?? ""],
    ["경쟁률", item.competition ?? ""],
    ["입주", item.moveIn ?? ""]
  ];

  return (
    <Link href={`/subscriptions/${item.id}`} className="block overflow-hidden rounded-xl border border-line-subtle bg-surface">
      <div className="relative h-[120px] bg-surface-tertiary">
        {item.image && <Image src={item.image} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex gap-1 p-2.5">
          {item.agency && <span className={`rounded-sm px-1.5 py-0.5 text-caption font-bold text-fg-ondark ${AGENCY_BADGE_BG[item.agency]}`}>{item.agency}</span>}
          {urgent && <span className="rounded-sm bg-brand px-1.5 py-0.5 text-caption font-bold text-brand-on">마감임박</span>}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="truncate text-compact font-bold text-fg-ondark">{item.title}</p>
            <p className="mt-0.5 text-caption text-white/70">{item.location}</p>
          </div>
          {item.dday !== null && <span className={`flex size-11 shrink-0 items-center justify-center rounded-md text-sm font-bold text-fg-heading ${urgent ? "bg-brand" : "bg-surface"}`}>
            D-{item.dday}
          </span>}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 py-3">
        <div className="flex gap-1">
          {item.sizes.map((size) => (
            <span key={size} className="rounded-sm bg-surface-tertiary px-1.5 py-0.5 text-caption font-medium text-fg-body">
              {size}㎡
            </span>
          ))}
        </div>
        <dl className="flex">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-0.5">
              <dt className="text-caption text-fg-disabled">{label}</dt>
              <dd className="whitespace-nowrap text-caption font-semibold text-fg-heading">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Link>
  );
}
