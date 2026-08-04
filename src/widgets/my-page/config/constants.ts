import type { MyListingStatus } from "../model/types";

// figma 135:1565 상태 배지. #EDF7ED는 토큰 미등록 — 기존 subscription 상세와 동일 처리(등록 후 토큰화 대상)
export const MY_STATUS_BADGE: Record<MyListingStatus, string> = {
  신청함: "bg-status-warning-bg text-brand-dark",
  관심등록: "bg-[#EDF7ED] text-status-success-text",
  저장됨: "bg-surface-tertiary text-fg-muted"
};

// figma 135:1556 마이페이지 탭
export const MY_TABS: { label: string; href: string }[] = [
  { label: "🏠 나의 청약", href: "/my" },
  { label: "❤️ 찜 목록", href: "/my/wishlist" },
  { label: "📦 주문내역", href: "/my/orders" }
];
