export interface HeaderNotification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

// figma 135:6964~ 알림 5건. TODO(API): 알림 API 연동 시 mock 제거(A1)
export const MOCK_NOTIFICATIONS: HeaderNotification[] = [
  { id: "1", icon: "⏰", title: "D-3 · 광진 자양 LH 주택", body: "신청 마감 3일 전입니다. 놓치지 마세요!", time: "2시간 전", unread: true },
  { id: "2", icon: "🎉", title: "청약 결과 발표", body: "마포 상암 SH — 신청 상태가 업데이트되었습니다.", time: "1일 전", unread: true },
  { id: "3", icon: "🚚", title: "주문하신 상품이 배송중입니다", body: "메소 액센트 체어 — 예상 배송일: 9월 22일", time: "2일 전", unread: false },
  { id: "4", icon: "💸", title: "가격 인하 알림", body: "할로 라운지 체어 ₩398,000으로 인하 (기존 ₩520,000)", time: "3일 전", unread: false },
  { id: "5", icon: "🏢", title: "서울 신규 공고 3건", body: "새로운 LH 공공주택 공고가 등록되었습니다.", time: "4일 전", unread: false }
];

// figma 170:77 내 정보 패널 메뉴
export const PROFILE_MENU: { emoji: string; label: string; href: string; active?: boolean }[] = [
  { emoji: "🏠", label: "마이페이지", href: "/my" },
  { emoji: "📋", label: "나의 청약", href: "/my", active: true },
  { emoji: "❤️", label: "찜 목록", href: "/my" },
  { emoji: "📦", label: "주문내역", href: "/my" },
  { emoji: "⚙️", label: "설정", href: "/my/profile" }
];
