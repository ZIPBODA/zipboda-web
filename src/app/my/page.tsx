import type { Metadata } from "next";
import { getMyPage, getWishlist, getOrders, ProfileCard, MyPageContent } from "@/widgets/my-page";

export const metadata: Metadata = {
  title: "마이페이지 | 집보다",
  description: "나의 청약·찜 목록·주문내역을 한곳에서 관리하세요."
};

// figma 135:1514·135:1768·135:2045 마이페이지(ZB-U-MY-01/02/03) — 나의청약·찜·주문을 한 페이지 탭으로 전환
export default async function MyPage() {
  const [{ profile, listings }, wishlist, orders] = await Promise.all([getMyPage(), getWishlist(), getOrders()]);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
      <h1 className="sr-only">마이페이지</h1>
      <ProfileCard profile={profile} />
      <MyPageContent listings={listings} wishlist={wishlist} orders={orders} />
    </main>
  );
}
