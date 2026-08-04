import type { CommunityPost, CommunityHero } from "../../model/types";

// figma 135:2334 인기글 히어로. TODO(API): 커뮤니티 API 연동 시 mock 제거(A1)
export const MOCK_HERO: CommunityHero = {
  id: "h1",
  handle: "@seoulstylist",
  title: "마포 상암 SH 청약 팁 — 첫 도전에 당첨됐어요!",
  likes: 1240,
  comments: 204,
  image: "/mock/community/community-1.png"
};

// figma 135:2355·135:2375·135:2395 게시글 3건
export const MOCK_POSTS: CommunityPost[] = [
  { id: "1", category: "인테리어", handle: "@minji_home", date: "2시간 전", title: "84㎡ LH 아파트 입주 후 거실 꾸미기", likes: 342, comments: 58, image: "/mock/community/community-2.png" },
  { id: "2", category: "가구", handle: "@nordic_room", date: "1일 전", title: "바움 스튜디오 소파 도착 — 개봉기 & 솔직 후기", likes: 876, comments: 131, image: "/mock/community/community-3.png" },
  { id: "3", category: "Q&A", handle: "@apt_diaries", date: "2일 전", title: "청약 공고의 경쟁률은 어떻게 보나요?", likes: 512, comments: 93, image: "/mock/community/community-4.png" }
];
