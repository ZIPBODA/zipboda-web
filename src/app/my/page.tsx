import type { Metadata } from "next";
import { getMyPage, ProfileCard, MyPageTabs, MySubscriptionList } from "@/widgets/my-page";

export const metadata: Metadata = {
  title: "나의 청약 | 집보다",
  description: "관심·구독한 공공주택 청약 공고와 신청 현황을 관리하세요."
};

// figma 135:1514 마이페이지 나의 청약(ZB-U-MY-01, PC)
export default async function MyPage() {
  const { profile, listings } = await getMyPage();

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
      <h1 className="sr-only">나의 청약</h1>
      <ProfileCard profile={profile} />
      <MyPageTabs active="/my" />
      <MySubscriptionList items={listings} />
    </main>
  );
}
