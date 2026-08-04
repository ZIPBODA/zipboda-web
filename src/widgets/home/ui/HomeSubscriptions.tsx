import { SubscriptionSummaryRow, type Subscription } from "@/entities/subscription";
import { HomeSection } from "./HomeSection";

// 홈 전용 청약 썸네일(/mock/main/main-list-1~6). 초과분은 공고 기본 이미지로 폴백
const HOME_LIST_IMAGES = 6;

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
        {items.map((item, i) => (
          <SubscriptionSummaryRow key={item.id} item={item} image={i < HOME_LIST_IMAGES ? `/mock/main/main-list-${i + 1}.png` : undefined} />
        ))}
      </div>
    </HomeSection>
  );
}
