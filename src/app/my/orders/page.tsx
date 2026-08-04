import type { Metadata } from "next";
import { getMyProfile, getOrders, ProfileCard, MyPageTabs, OrderList } from "@/widgets/my-page";

export const metadata: Metadata = {
  title: "주문내역 | 집보다",
  description: "가구 주문과 배송 상태를 확인하세요."
};

// figma 135:2045 마이페이지 주문내역(ZB-U-MY-03, PC)
export default async function OrdersPage() {
  const [profile, items] = await Promise.all([getMyProfile(), getOrders()]);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
      <h1 className="sr-only">주문내역</h1>
      <ProfileCard profile={profile} />
      <MyPageTabs active="/my/orders" />
      <OrderList items={items} />
    </main>
  );
}
