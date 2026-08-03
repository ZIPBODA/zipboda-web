import type { SubscriptionDetail } from "../../model/types";

// figma 135:4998 청약 상세. TODO(API-011): 실 API 연동 시 mock 전량 제거(A1)
export const MOCK_SUBSCRIPTION_DETAIL: SubscriptionDetail = {
  id: "1",
  agency: "LH",
  agencyLabel: "LH 공공",
  status: "접수중",
  title: "광진 자양 LH 주택",
  address: "서울 · 광진구 · 자양동",
  dday: 3,
  applyPeriod: "2025년 8월 12일 - 15일",
  households: "480세대",
  supplyType: "국민 일반",
  competition: "12.4 : 1",
  contractDate: "2025년 9월",
  moveIn: "2026년 3월",
  postDate: "2025년 7월 25일",
  units: [
    { size: 59, type: "A" },
    { size: 84, type: "A" },
    { size: 114, type: "A" }
  ],
  defaultUnitSize: 84,
  applyUrl: "https://apply.lh.or.kr"
};
