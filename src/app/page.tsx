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
  MobileFurniture,
  HOME_SUBSCRIPTION_COUNT
} from "@/widgets/home";

/**
 * 요청 때 그린다. 주소 값을 읽지 않는 화면이라 그대로 두면 빌드가 미리 그리며 API를 부른다 — API에 닿지 않는 빌드(CI)가 깨진다.
 * API 응답은 fetch의 60초 데이터 캐시(shared/api/client)로 계속 아낀다
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "집보다 — 공공주택 청약부터 가구까지",
  description: "LH·SH·GH·IH 공공주택 청약 공고, 2D·3D 인터랙티브 평면도, 맞춤 가구 쇼핑을 한곳에서"
};

// figma 135:7027 메인 홈(MAIN-01)
export default async function Home() {
  const [{ items: subscriptions }, floorplans, products] = await Promise.all([
    getSubscriptions({}, { pageSize: HOME_SUBSCRIPTION_COUNT }),
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
