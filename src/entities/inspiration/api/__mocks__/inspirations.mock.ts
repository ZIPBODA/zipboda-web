import type { InspirationItem } from "../../model/types";

// figma 135:2949~ 집구경 9건(카드 높이=Figma 실측). 핸들·좋아요는 라이트박스(135:3135) 노출. TODO(API): 실 연동 시 제거(A1)
export const MOCK_INSPIRATIONS: InspirationItem[] = [
  { id: "1", category: "거실", handle: "@nordic_room", likes: 1240, height: 266 },
  { id: "2", category: "침실", handle: "@cozy_bedroom", likes: 892, height: 476 },
  { id: "3", category: "주방", handle: "@kitchen_diary", likes: 654, height: 266 },
  { id: "4", category: "거실", handle: "@minimal_living", likes: 1103, height: 331 },
  { id: "5", category: "다이닝", handle: "@dining_moods", likes: 745, height: 463 },
  { id: "6", category: "서재", handle: "@study_nook", likes: 421, height: 266 },
  { id: "7", category: "침실", handle: "@sleep_well", likes: 980, height: 331 },
  { id: "8", category: "욕실", handle: "@bath_time", likes: 533, height: 529 },
  { id: "9", category: "거실", handle: "@home_stylist", likes: 1450, height: 266 }
];
