import { FloorplanShowcaseCard, type FloorplanShowcase } from "@/entities/floorplan";
import { HomeSection } from "./HomeSection";

// figma 135:7285 인터랙티브 평면도
export function HomeFloorplans({ items }: { items: FloorplanShowcase[] }) {
  return (
    <HomeSection title="인터랙티브 평면도" description="지정 주택의 원본 도면과 검수된 3D 구조" actionLabel="전체 보기" actionHref="/subscriptions">
      <div className="grid grid-cols-3 gap-5">
        {items.map((item) => (
          <FloorplanShowcaseCard key={item.id} item={item} />
        ))}
      </div>
    </HomeSection>
  );
}
