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

// figma 419:10687 모바일 퀵메뉴 — 5개(PC 카테고리 6종과 별개 구성). href는 앱 라우트로 연결
// '가구'는 '쇼핑'과 동일 페이지(/shop)라 제거하고, '가점계산' 우측에 '커뮤니티' 추가
export const HOME_QUICK_MENU: { icon: string; label: string; href: string }[] = [
  { icon: "🏢", label: "청약", href: "/subscriptions" },
  { icon: "🏪", label: "쇼핑", href: "/shop" },
  { icon: "📸", label: "인테리어 영감", href: "/inspirations" },
  { icon: "📊", label: "가점계산", href: "/score" },
  { icon: "💬", label: "커뮤니티", href: "/community" }
];

// figma 419:10668 모바일 프로모 캐러셀. 슬라이드1=Figma 확정, 2·3=기존 앱 섹션 카피 재사용
// TODO(API): 프로모션 배너 API 연동 시 mock 제거(A1). Figma는 3-dot(1/3)만 정의, 슬라이드 콘텐츠는 1건만 확정(D6)
export const HOME_PROMO_SLIDES: { image: string; badge?: string; title: string; subtitle: string }[] = [
  { image: "/mock/main/main-banner.png", badge: "🏠 NEW", title: "2026년 3분기 LH 청약 오픈", subtitle: "이번 주 마감 공고 3건" },
  { image: "/mock/main/main-interactive-1.png", title: "인터랙티브 3D 평면도", subtitle: "2D·3D 미리보기 + 가구 매칭" },
  { image: "/mock/shop/s3-1.webp", title: "인기 가구 추천", subtitle: "새 집을 위한 엄선된 가구" }
];
