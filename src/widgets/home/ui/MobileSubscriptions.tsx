import Image from "next/image";
import Link from "next/link";
import type { Subscription } from "@/entities/subscription";
import { MobileHomeSection } from "./MobileHomeSection";

// 마감 임박(D-7 이하)은 D-day 박스를 brand로 강조(figma 419:10731 — 별도 배지 없음)
const URGENT_DDAY = 7;

// figma 419:10709 모바일 공공 청약 — 세로 리스트(썸네일 + 정보 + D-day 박스)
export function MobileSubscriptions({ items }: { items: Subscription[] }) {
  return (
    <MobileHomeSection title="공공 청약" actionLabel="전체 보기" actionHref="/subscriptions">
      <ul className="flex flex-col gap-2 px-3">
        {items.map((item) => {
          const urgent = item.dday !== null && item.dday <= URGENT_DDAY;
          return (
            <li key={item.id}>
              <Link href={`/subscriptions/${item.id}`} className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface p-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-tertiary">
                  {item.image && <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-fg-heading">{item.title}</span>
                  <span className="mt-0.5 block text-caption text-fg-disabled">{item.location}</span>
                  <span className="mt-1.5 flex gap-1">
                    {item.sizes.map((size) => (
                      <span key={size} className="rounded-sm bg-surface-tertiary px-1.5 py-0.5 text-caption font-medium text-fg-body">
                        {size}㎡
                      </span>
                    ))}
                  </span>
                </span>
                {item.dday !== null && <span
                  className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-lg text-sm font-bold ${
                    urgent ? "bg-brand text-fg-heading" : "bg-surface-tertiary text-gray-700"
                  }`}
                >
                  D-{item.dday}
                </span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </MobileHomeSection>
  );
}
