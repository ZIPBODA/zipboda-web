import type { Metadata } from "next";
import { getSubscriptions, type SubscriptionSort } from "@/entities/subscription";
import { SubscriptionFilters, SubscriptionListView } from "@/widgets/subscription-list";

export const metadata: Metadata = {
  title: "공공주택 청약 | 집보다",
  description: "LH·SH·GH·IH 공공주택 청약 공고 목록"
};

interface PageProps {
  searchParams: { region?: string; size?: string; agency?: string; sort?: string };
}

// figma 135:5601 청약 공고 목록(SUBS-01)
export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const items = await getSubscriptions({
    region: searchParams.region,
    size: searchParams.size,
    agency: searchParams.agency,
    sort: searchParams.sort as SubscriptionSort | undefined
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10">
      {/* figma 135:5603 헤더(타이틀 + 뷰 토글) */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-h1 font-bold tracking-[-0.0125em] text-fg-heading">공공주택</h1>
          <p className="mt-1 text-sm text-fg-muted">진행중 공고 {items.length}건 · 2025년 7월 22일 업데이트</p>
        </div>
        <div className="flex rounded-lg bg-surface-tertiary p-1">
          <span className="rounded-md bg-surface px-4 py-2 text-sm font-semibold text-fg-heading shadow-sm">목록</span>
          <span aria-disabled className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-fg-disabled">
            📍 지도
          </span>
        </div>
      </header>

      <div className="mt-8">
        <SubscriptionFilters />
      </div>
      <div className="mt-8">
        <SubscriptionListView items={items} />
      </div>
    </main>
  );
}
