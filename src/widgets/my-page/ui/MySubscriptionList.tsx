"use client";

import { useState } from "react";
import { DDAY_URGENT_THRESHOLD } from "@/entities/subscription";
import { MY_STATUS_BADGE } from "../config/constants";
import type { MyListing } from "../model/types";

// figma 135:1564 관심/구독 공고 리스트 — 신청함 토글은 클라이언트 상태
export function MySubscriptionList({ items }: { items: MyListing[] }) {
  return (
    <div className="mt-5 flex flex-col gap-3 md:mt-7 md:gap-5">
      {items.map((item) => (
        <ListingRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ListingRow({ item }: { item: MyListing }) {
  const [applied, setApplied] = useState(item.applied);
  const urgent = item.dday <= DDAY_URGENT_THRESHOLD;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface p-4 md:gap-5 md:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-lg md:size-12 md:text-xl" aria-hidden>
        🏢
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg-heading md:text-base">{item.title}</p>
        <p className="mt-0.5 text-xs text-fg-disabled md:text-sm">평형: {item.size}㎡</p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className={`rounded-md px-3 py-1.5 text-xs font-semibold ${MY_STATUS_BADGE[item.status]}`}>{item.status}</span>

          <a
            href={item.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full border border-line bg-surface-secondary px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-surface-tertiary"
          >
            <ArrowUpRight />
            기관 신청 바로가기
          </a>

          <button
            type="button"
            onClick={() => setApplied((v) => !v)}
            aria-pressed={applied}
            className="flex items-center gap-2 rounded-full border border-line bg-surface-secondary px-2.5 py-1.5 text-xs font-semibold text-gray-700"
          >
            신청함
            <span className={`relative h-[18px] w-8 rounded-full transition-colors ${applied ? "bg-brand" : "border border-line bg-surface-tertiary"}`}>
              <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-surface shadow transition-all ${applied ? "left-4" : "left-0.5"}`} />
            </span>
          </button>
        </div>
      </div>

      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold md:size-14 md:text-sm ${
          urgent ? "bg-brand text-fg-heading" : "bg-surface-tertiary text-fg-disabled"
        }`}
      >
        D-{item.dday}
      </span>
    </div>
  );
}

function ArrowUpRight() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}
