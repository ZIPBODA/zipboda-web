import { FloorplanShowcaseCard, type FloorplanShowcase } from "@/entities/floorplan";
import { HomeSection } from "./HomeSection";

// figma 135:7285 인터랙티브 평면도
export function HomeFloorplans({ items }: { items: FloorplanShowcase[] }) {
  return (
    <HomeSection title="인터랙티브 평면도" description="2D & 3D 미리보기 + 가구 매칭" actionLabel="전체 보기">
      <div className="grid grid-cols-3 gap-5">
        {items.map((item) => (
          <FloorplanShowcaseCard key={item.id} item={item} />
        ))}
      </div>
    </HomeSection>
  );
}
