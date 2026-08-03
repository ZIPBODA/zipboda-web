// figma 135:7033 카테고리 타일. 이동 대상이 디자인에 정의되지 않아 라우팅은 연결하지 않는다(D2/D6)
export const HOME_CATEGORIES: { icon: string; label: string; description: string }[] = [
  { icon: "🏢", label: "LH 주택", description: "공공임대" },
  { icon: "🌆", label: "SH 아파트", description: "시영주택" },
  { icon: "🛋️", label: "가구 특가", description: "최대 50% 할인" },
  { icon: "📸", label: "인테리어 영감", description: "실제 집" },
  { icon: "🔧", label: "리모델링", description: "무료 견적" },
  { icon: "🚚", label: "이사 도움", description: "견적 받기" }
];

// figma 135:7776 히어로 우하단 지표
export const HOME_HERO_STATS: { value: string; label: string }[] = [
  { value: "14,200+", label: "평면도" },
  { value: "3,400+", label: "진행중 공고" },
  { value: "98,000+", label: "가구 상품" }
];
