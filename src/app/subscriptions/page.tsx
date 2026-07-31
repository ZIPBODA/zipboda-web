import type { Metadata } from "next";
import { getSubscriptions, type SubscriptionSort } from "@/entities/subscription";
import { SubscriptionFilters, SubscriptionListView } from "@/widgets/subscription-list";

// figma 135:5598 청약 공고 목록(ZB-U-SUBS-01, PC). 목록/상세 SSR·ISR 대상.
export const metadata: Metadata = {
  title: "청약 공고 | 집보다",
  description: "LH·SH·GH·IH 공공주택 청약 공고를 지역·평형·공급기관으로 살펴보세요."
};

type SearchParams = { region?: string; agency?: string; size?: string; sort?: string };

export default async function SubscriptionsPage({ searchParams }: { searchParams: SearchParams }) {
  const items = await getSubscriptions({
    region: searchParams.region,
    agency: searchParams.agency,
    size: searchParams.size,
    sort: searchParams.sort as SubscriptionSort | undefined
  });

  return (
    <main className="mx-auto max-w-[1280px] px-6 pb-20 pt-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-fg-heading">LH·SH·GH·IH 공공주택</h1>
          <p className="mt-1 text-sm text-fg-muted">진행중 공고 {items.length}건</p>
        </div>
        {/* figma 목록/지도 토글 — 지도(ZB-U-SUBS-02)는 후속 구현 */}
        <div className="flex rounded-xl bg-surface-tertiary p-1">
          <span className="rounded-lg bg-surface px-4 py-2 text-sm font-bold text-fg-strong shadow-sm">목록</span>
          <span className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium text-fg-disabled" title="지도 보기(준비 중)">
            📍 지도
          </span>
        </div>
      </header>

      <div className="mb-6">
        <SubscriptionFilters />
      </div>

      <SubscriptionListView items={items} />
    </main>
  );
}
