"use client";

import Link from "next/link";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";

export function SubscriptionMapRail() {
  const { listHref } = useSubscriptionFilters();
  return (
    <nav aria-label="청약 탐색 메뉴" className="hidden w-20 shrink-0 flex-col items-stretch gap-2 border-r border-line-subtle bg-surface p-2 md:flex">
      <Link href="/" className="flex min-h-12 items-center justify-center rounded-lg text-sm font-semibold text-fg-muted hover:bg-surface-secondary">홈</Link>
      <span aria-current="page" className="flex min-h-12 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-on">지도</span>
      <Link href={listHref} className="flex min-h-12 items-center justify-center rounded-lg text-sm font-semibold text-fg-muted hover:bg-surface-secondary">목록</Link>
    </nav>
  );
}
