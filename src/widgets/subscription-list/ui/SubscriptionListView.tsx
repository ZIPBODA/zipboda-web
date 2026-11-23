"use client";

import { getImageProps } from "next/image";
import {
  MOBILE_CARD_IMAGE_SIZES,
  SubscriptionCard,
  SubscriptionCardMobile,
  SubscriptionLoadMore,
  useSubscriptionPages,
  type LoadSubscriptionPage,
  type SubscriptionPage
} from "@/entities/subscription";
import { MOBILE_LIST_MEDIA } from "../config/constants";

/**
 * 모바일 목록의 첫 카드 사진이 이 화면의 LCP다. 늦게 받는(lazy) 사진이라 모바일 폭에서만 미리 받는다 —
 * next/image의 priority는 폭 조건 없이 미리 받아, PC에서도 숨은 모바일 사진을 높은 우선순위로 받는다
 */
function MobileLeadImagePreload({ src }: { src: string }) {
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: MOBILE_CARD_IMAGE_SIZES });
  return <link rel="preload" as="image" imageSrcSet={props.srcSet} imageSizes={props.sizes} media={MOBILE_LIST_MEDIA} fetchPriority="high" />;
}

// figma PC 413:718(가로 카드) / Mobile 419:10136(세로 이미지배경 카드) — 이중 렌더
export function SubscriptionListView({ initialPage, loadPage }: { initialPage: SubscriptionPage; loadPage: LoadSubscriptionPage }) {
  const { items, hasMore, loading, failed, loadMore } = useSubscriptionPages(initialPage, loadPage);
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line-subtle bg-surface-secondary py-20 text-center">
        <p className="text-base font-semibold text-fg-body">조건에 맞는 공고가 없습니다</p>
        <p className="text-sm text-fg-muted">필터를 변경해 다시 검색해 보세요.</p>
      </div>
    );
  }
  const leadImage = items[0]?.image;
  return (
    <>
      {leadImage && <MobileLeadImagePreload src={leadImage} />}
      {/* PC(≥768) 가로 카드 */}
      <div className="hidden flex-col gap-4 md:flex">
        {items.map((item) => (
          <SubscriptionCard key={item.id} item={item} />
        ))}
      </div>
      {/* 모바일(≤767) 세로 카드 */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <SubscriptionCardMobile key={item.id} item={item} />
        ))}
      </div>
      {hasMore && <SubscriptionLoadMore loading={loading} failed={failed} onLoadMore={() => void loadMore()} />}
    </>
  );
}
