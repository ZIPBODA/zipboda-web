// figma 353:3102 하단 탭 5종(ZB-U-COM-02). PC GNB(NAV_ITEMS)의 부분집합이며 순서·구성이 디자인 기준
export const BOTTOM_NAV_ITEMS = [
  { label: "홈", href: "/", icon: "home" },
  { label: "청약", href: "/subscriptions", icon: "subscription" },
  { label: "쇼핑", href: "/shop", icon: "shop" },
  { label: "커뮤니티", href: "/community", icon: "community" },
  { label: "마이페이지", href: "/my", icon: "my" }
] as const;

export type BottomNavIcon = (typeof BOTTOM_NAV_ITEMS)[number]["icon"];
