import type { Subscription } from "../../model/types";

// figma 135:5601 공고 목록 6건. TODO(API-010): 실 API 연동 시 mock 전량 제거(A1)
export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: "1", agency: "LH", title: "광진 자양 LH 주택", region: "서울", location: "서울 · 광진구", sizes: [59, 84], applicants: 1240, households: 480, competition: "12.4:1", moveIn: "2026년 3월", dday: 3 },
  { id: "2", agency: "SH", title: "마포 상암 SH 아파트", region: "서울", location: "서울 · 마포구", sizes: [39, 59, 84], applicants: 3580, households: 820, competition: "28.7:1", moveIn: "2026년 6월", dday: 10 },
  { id: "3", agency: "LH", title: "인천 송도 LH 단지", region: "인천", location: "인천 · 연수구", sizes: [59, 84, 114], applicants: 2100, households: 630, competition: "8.9:1", moveIn: "2026년 9월", dday: 17 },
  { id: "4", agency: "SH", title: "성남 분당 SH 타워", region: "경기", location: "경기 · 성남", sizes: [84, 114], applicants: 4120, households: 290, competition: "34.2:1", moveIn: "2026년 12월", dday: 24 },
  { id: "5", agency: "LH", title: "수원 권선 LH 임대", region: "경기", location: "경기 · 수원", sizes: [39, 59], applicants: 980, households: 340, competition: "6.1:1", moveIn: "2027년 1월", dday: 31 },
  { id: "6", agency: "LH", title: "동대문 제기 LH 청년", region: "서울", location: "서울 · 동대문구", sizes: [39, 59], applicants: 2740, households: 210, competition: "19.5:1", moveIn: "2027년 2월", dday: 37 }
];
