import type { Metadata } from "next";
import { getMyProfile, getWishlist, ProfileCard, MyPageTabs, WishlistGrid } from "@/widgets/my-page";

export const metadata: Metadata = {
  title: "찜 목록 | 집보다",
  description: "찜한 가구를 모아 보고 장바구니에 담으세요."
};

// figma 135:1768 마이페이지 찜 목록(ZB-U-MY-02, PC)
export default async function WishlistPage() {
  const [profile, items] = await Promise.all([getMyProfile(), getWishlist()]);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
      <h1 className="sr-only">찜 목록</h1>
      <ProfileCard profile={profile} />
      <MyPageTabs active="/my/wishlist" />
      <WishlistGrid items={items} />
    </main>
  );
}
