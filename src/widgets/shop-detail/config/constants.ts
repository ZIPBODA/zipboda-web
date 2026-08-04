// figma 135:3954 혜택 안내
export const PRODUCT_BENEFITS = [
  { icon: "🚚", label: "50만원 이상 무료배송" },
  { icon: "🔄", label: "30일 반품" },
  { icon: "🛡️", label: "1년 보증" }
];

// figma 135:3971 상세 탭
export const DETAIL_TABS = [
  { id: "detail", label: "상세정보" },
  { id: "size", label: "크기" },
  { id: "review", label: "리뷰" }
] as const;

export type DetailTabId = (typeof DETAIL_TABS)[number]["id"];
