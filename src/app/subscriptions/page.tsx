import type { Metadata } from "next";
import { getSubscriptions, type SubscriptionSort } from "@/entities/subscription";
import { PageContainer, PageHeader } from "@/shared/ui";
import { SubscriptionFilters, MobileSubscriptionFilters, SubscriptionListView } from "@/widgets/subscription-list";

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
    <PageContainer>
      {/* figma PC 413:645 / Mobile 419:10092 헤더(타이틀 + 뷰 토글) */}
      <PageHeader
        title="공공주택"
        description={`현황도 기반 주택 ${items.length}건`}
        actions={
          <>
            {/* PC: 목록/지도 세그먼트 */}
            <div className="hidden rounded-lg bg-surface-tertiary p-1 md:flex">
              <span className="rounded-md bg-surface px-4 py-2 text-sm font-semibold text-fg-heading shadow-sm">목록</span>
              <span aria-disabled className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-fg-disabled">
                📍 지도
              </span>
            </div>
            {/* 모바일: 지도 단일 버튼 */}
            <span aria-disabled className="flex cursor-not-allowed items-center gap-1 rounded-lg bg-surface-tertiary px-3 py-1.5 text-2xsmall font-medium text-fg-muted md:hidden">
              📍 지도
            </span>
          </>
        }
      />

      {/* PC 필터 바 / 모바일 칩레일 */}
      <div className="mt-6 md:mt-8">
        <div className="hidden md:block">
          <SubscriptionFilters />
        </div>
        <div className="md:hidden">
          <MobileSubscriptionFilters />
        </div>
      </div>
      <div className="mt-4 md:mt-6">
        <SubscriptionListView items={items} />
      </div>
    </PageContainer>
  );
}
