import type { Metadata } from "next";
import { loadMapDetail } from "./mapDetailAction";
import { getSubscriptionFilterOptions, getSubscriptions, type SubscriptionSort } from "@/entities/subscription";
import { PageContainer, PageHeader } from "@/shared/ui";
import {
  SubscriptionFilters,
  MobileSubscriptionFilters,
  SubscriptionListView,
  SubscriptionMapWorkspace,
  SubscriptionsReturnTracker,
  ListViewToggle,
  DEFAULT_SUBSCRIPTION_LIST_VIEW,
  SUBSCRIPTION_LIST_VIEW_KEYS,
  type SubscriptionListViewKey
} from "@/widgets/subscription-list";

export const metadata: Metadata = {
  title: "공공주택 청약 | 집보다",
  description: "LH·SH·GH·IH 공공주택 청약 공고를 지도에서 찾고 목록으로 비교"
};

type PageProps = {
  searchParams: { region?: string; size?: string; agency?: string; sort?: string; view?: string; q?: string; status?: string };
};

// figma 135:5601 청약 공고 목록(SUBS-01). 첫 화면은 지도이고 목록은 ?view=list로 연다
export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const [items, filterOptions] = await Promise.all([
    getSubscriptions({
      region: searchParams.region,
      size: searchParams.size,
      agency: searchParams.agency,
      q: searchParams.q,
      status: searchParams.status,
      sort: searchParams.sort as SubscriptionSort | undefined
    }),
    getSubscriptionFilterOptions()
  ]);

  // 모르는 값은 첫 화면(지도)으로 되돌린다 — 예전 링크나 오타가 빈 화면이 되지 않게
  const view: SubscriptionListViewKey = SUBSCRIPTION_LIST_VIEW_KEYS.includes(searchParams.view ?? "")
    ? (searchParams.view as SubscriptionListViewKey)
    : DEFAULT_SUBSCRIPTION_LIST_VIEW;

  if (view === "map") {
    return (
      <>
        <SubscriptionsReturnTracker />
        <SubscriptionMapWorkspace items={items} options={filterOptions} loadDetail={loadMapDetail} />
      </>
    );
  }

  return (
    <PageContainer>
      <SubscriptionsReturnTracker />
      {/* figma PC 413:645 / Mobile 419:10092 헤더(타이틀 + 뷰 토글) */}
      <PageHeader
        title="공공주택"
        description={`현황도 기반 주택 ${items.length}건`}
        actions={<ListViewToggle searchParams={searchParams} view={view} />}
      />

      {/* PC 필터 바 / 모바일 칩레일 */}
      <div className="mt-6 md:mt-8">
        <div className="hidden md:block">
          <SubscriptionFilters options={filterOptions} />
        </div>
        <div className="md:hidden">
          <MobileSubscriptionFilters options={filterOptions} />
        </div>
      </div>
      <div className="mt-4 md:mt-6">
        <SubscriptionListView items={items} />
      </div>
    </PageContainer>
  );
}
