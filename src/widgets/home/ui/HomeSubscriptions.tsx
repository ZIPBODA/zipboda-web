import { SubscriptionSummaryRow, type Subscription } from "@/entities/subscription";
import { HomeSection } from "./HomeSection";

// figma 135:7075 LH/SH 공공 청약
export function HomeSubscriptions({ items }: { items: Subscription[] }) {
  return (
    <HomeSection
      title="LH/SH 공공 청약"
      description="최신 청약 마감일 — D-Day 전에 신청하세요"
      actionLabel="전체 보기"
      actionHref="/subscriptions"
    >
      <div className="flex flex-col gap-5">
        {items.map((item) => (
          <SubscriptionSummaryRow key={item.id} item={item} />
        ))}
      </div>
    </HomeSection>
  );
}
