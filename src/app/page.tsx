import type { Metadata } from "next";
import { getSubscriptions } from "@/entities/subscription";
import { getFeaturedFloorplans } from "@/entities/floorplan";
import { getFeaturedProducts } from "@/entities/product";
import {
  HomeHero,
  HomeCategories,
  HomeSubscriptions,
  HomeFloorplans,
  HomeFurniture,
  MobilePromoCarousel,
  MobileQuickMenu,
  MobileSubscriptions,
  MobileFloorplans,
  MobileFurniture
} from "@/widgets/home";

export const metadata: Metadata = {
  title: "집보다 — 공공주택 청약부터 가구까지",
  description: "LH·SH·GH·IH 공공주택 청약 공고, 2D·3D 인터랙티브 평면도, 맞춤 가구 쇼핑을 한곳에서"
};

// figma 135:7027 메인 홈(MAIN-01)
export default async function Home() {
  const [subscriptions, floorplans, products] = await Promise.all([
    getSubscriptions(),
    getFeaturedFloorplans(),
    getFeaturedProducts()
  ]);

  return (
    <main>
      {/* 모바일(≤767) — figma 419:10637. 회색 배경 위 흰 섹션 블록(gap 8) */}
      <div className="flex flex-col gap-2 bg-surface-tertiary md:hidden">
        <MobilePromoCarousel />
        <MobileQuickMenu />
        <MobileSubscriptions items={subscriptions} />
        <MobileFloorplans items={floorplans} />
        <MobileFurniture items={products} />
      </div>

      {/* PC(≥768) — figma 411:146 */}
      <div className="hidden md:block">
        <HomeHero />
        <HomeCategories />
        <HomeSubscriptions items={subscriptions} />
        <HomeFloorplans items={floorplans} />
        <HomeFurniture items={products} />
      </div>
    </main>
  );
}
