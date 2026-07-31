import { SubscriptionCard, type Subscription } from "@/entities/subscription";

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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <SubscriptionCard key={item.id} item={item} />
      ))}
    </div>
  );
}
