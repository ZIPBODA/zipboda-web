import { SubscriptionCard, SubscriptionCardMobile, type Subscription } from "@/entities/subscription";

// figma PC 413:718(가로 카드) / Mobile 419:10136(세로 이미지배경 카드) — 이중 렌더
export function SubscriptionListView({ items }: { items: Subscription[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line-subtle bg-surface-secondary py-20 text-center">
        <p className="text-base font-semibold text-fg-body">조건에 맞는 공고가 없습니다</p>
        <p className="text-sm text-fg-muted">필터를 변경해 다시 검색해 보세요.</p>
      </div>
    );
  }
  return (
    <>
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
    </>
  );
}
