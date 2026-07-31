// figma 135:7846 / 170:2 GNB 주 메뉴 (평면도는 청약으로 통합되어 제외)
export const NAV_ITEMS = [
  { label: "홈", href: "/" },
  { label: "청약", href: "/subscriptions" },
  { label: "쇼핑", href: "/shop" },
  { label: "인테리어 영감", href: "/inspirations" },
  { label: "가점계산", href: "/score" },
  { label: "커뮤니티", href: "/community" },
  { label: "마이페이지", href: "/my" }
] as const;
