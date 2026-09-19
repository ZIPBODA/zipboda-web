// figma 419:10394 모바일 상세 탭. 2D 프레임 기준(3D 프레임은 2탭이나 더 완전한 2D를 따른다).
// 단지배치도는 매입임대 단일 건물이라 원본 현황도에 존재하지 않아 두지 않는다
export const MOBILE_DETAIL_TABS = [
  { key: "2d", label: "2D 평면도" },
  { key: "3d", label: "3D 평면도" },
  { key: "location", label: "위치" }
] as const;

export type MobileDetailTab = (typeof MOBILE_DETAIL_TABS)[number]["key"];

export const MOBILE_DETAIL_TAB_KEYS = MOBILE_DETAIL_TABS.map((t) => t.key);

export const DEFAULT_MOBILE_DETAIL_TAB: MobileDetailTab = "2d";
