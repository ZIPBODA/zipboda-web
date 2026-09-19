import type { MyProfile, MyListing, WishlistItem, Order, ProfileEditData } from "../../model/types";

// figma 135:1519 프로필. TODO(API): 실 사용자/집계 연동 시 mock 제거(A1)
export const MOCK_PROFILE: MyProfile = {
  name: "김민지",
  email: "minji@email.com",
  region: "서울, 대한민국",
  verified: true,
  stats: [
    { label: "신청함", value: 3 },
    { label: "찜 목록", value: 12 },
    { label: "주문내역", value: 5 },
    { label: "리뷰", value: 8 }
  ]
};

// figma 135:1565·135:1579·135:1593 관심/구독 공고. 신청은 각 기관 페이지로 이동(REQ-US-001)
export const MOCK_MY_LISTINGS: MyListing[] = [
  { id: "1", title: "광진 자양 LH 주택", size: 84, status: "신청함", dday: 3, applyUrl: "https://apply.lh.or.kr", applied: true },
  { id: "2", title: "마포 상암 SH 아파트", size: 59, status: "관심등록", dday: 10, applyUrl: "https://www.i-sh.co.kr", applied: false },
  { id: "3", title: "인천 송도 LH 단지", size: 114, status: "저장됨", dday: 17, applyUrl: "https://apply.lh.or.kr", applied: false }
];

// figma 135:1819·135:1840·135:1861 찜한 가구
export const MOCK_WISHLIST: WishlistItem[] = [
  { id: "1", brand: "바움 스튜디오", name: "노르딕 3인 소파", discount: 28, price: 1280000, originalPrice: 1780000, image: "/mock/mypage/mypage-1.png" },
  { id: "2", brand: "폼 스튜디오", name: "메소 액센트 체어", discount: 22, price: 485000, originalPrice: 620000, image: "/mock/mypage/mypage-2.png" },
  { id: "3", brand: "루네 오브제", name: "할로 라운지 체어", discount: 23, price: 398000, originalPrice: 520000, image: "/mock/mypage/mypage-3.png" }
];

// figma 135:2096·135:2111·135:2126 주문내역
export const MOCK_ORDERS: Order[] = [
  { id: "1", brand: "바움 스튜디오", name: "노르딕 3인 소파", orderDate: "2026년 9월 8일 주문", price: 1280000, status: "배송완료", image: "/mock/mypage/mypage-1.png" },
  { id: "2", brand: "폼 스튜디오", name: "메소 액센트 체어", orderDate: "2026년 9월 15일 주문", price: 485000, status: "배송중", image: "/mock/mypage/mypage-2.png" },
  { id: "3", brand: "루네 오브제", name: "할로 라운지 체어", orderDate: "2026년 9월 18일 주문", price: 398000, status: "준비중", image: "/mock/mypage/mypage-3.png" }
];

// figma 208:263 프로필 수정 초기값
export const MOCK_PROFILE_EDIT: ProfileEditData = {
  nickname: "김민지",
  email: "minji@email.com",
  phone: "010-1234-5678",
  bio: "인테리어와 집꾸미기를 좋아하는 3년차 입주민입니다. 84㎡ 아파트에서 미니멀 라이프를 실천 중이에요.",
  interests: ["인테리어"]
};
