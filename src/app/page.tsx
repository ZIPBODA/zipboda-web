import type { Metadata } from "next";
import { getSubscriptions } from "@/entities/subscription";
import { getFeaturedFloorplans } from "@/entities/floorplan";
import { getFeaturedProducts } from "@/entities/product";
import { HomeHero, HomeCategories, HomeSubscriptions, HomeFloorplans, HomeFurniture } from "@/widgets/home";

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
      <HomeHero />
      <HomeCategories />
      <HomeSubscriptions items={subscriptions} />
      <HomeFloorplans items={floorplans} />
      <HomeFurniture items={products} />
    </main>
  );
}
