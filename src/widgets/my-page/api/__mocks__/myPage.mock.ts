import type { MyProfile, MyListing } from "../../model/types";

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
