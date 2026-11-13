"use client";

import {
  SubscriptionCardMobile,
  SubscriptionLoadMore,
  useSubscriptionPages,
  type LoadSubscriptionPage,
  type SubscriptionPage
} from "@/entities/subscription";

/** 검색 결과의 공공주택 칸. 목록 화면처럼 첫 페이지 뒤는 '더 보기'로 이어 받는다 */
export function SearchHousingResults({ initialPage, loadPage }: { initialPage: SubscriptionPage; loadPage: LoadSubscriptionPage }) {
  const { items, hasMore, loading, failed, loadMore } = useSubscriptionPages(initialPage, loadPage);
  if (items.length === 0) return <p className="rounded-xl bg-surface-secondary p-6 text-sm text-fg-muted">검색된 공공주택이 없습니다.</p>;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <SubscriptionCardMobile key={item.id} item={item} />)}</div>
      {hasMore && <SubscriptionLoadMore loading={loading} failed={failed} onLoadMore={() => void loadMore()} />}
    </>
  );
}
