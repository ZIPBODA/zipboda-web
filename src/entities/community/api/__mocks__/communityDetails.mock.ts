import type { CommunityComment, CommunityPostDetail } from "../../model/types";

// figma 199:317·326·335 댓글(전 글 공통 mock)
const COMMENTS: CommunityComment[] = [
  { id: "c1", handle: "@seoul_designer", time: "30분 전", likes: 12, body: "거실 분위기 너무 좋아요! 소파 어디서 구매하셨나요?" },
  { id: "c2", handle: "@interior_lover", time: "2시간 전", likes: 8, body: "저도 비슷한 평수인데 참고 많이 됩니다 감사합니다" },
  { id: "c3", handle: "@happy_newlywed", time: "5시간 전", likes: 5, body: "조명이 포인트네요! 브랜드 알려주실 수 있나요?" }
];

// figma 199:291·294·297 본문(글 상세)
const POST1_BODY = [
  "안녕하세요! 드디어 고대하던 LH 아파트에 입주하게 되어 랜선 집들이 겸 거실 꾸미기 후기를 올려봅니다. 84㎡ 평수라 거실을 어떻게 활용해야 할지 고민이 정말 많았는데요, 최대한 미니멀하면서도 따뜻한 원목 감성을 주려고 노력했어요.",
  "먼저 소파는 패브릭 소재의 모듈형 소파를 선택했어요. 거실 평수에 맞게 배치를 바꿀 수 있어서 아주 유용합니다. 러그는 소파와 톤온톤으로 베이지 계열을 선택해 통일감을 주었습니다. 밤에는 메인 조명을 끄고 간접 등과 스탠드 조명만 켜두는데, 훨씬 아늑하고 조용한 카페에 온 듯한 느낌을 줍니다.",
  "소소한 소품들과 화분들로 포인트를 주니 삭막했던 신축 아파트 거실이 금방 따뜻한 보금자리로 변하더라구요. 집꾸미기를 시작하시는 다른 입주민 분들께도 많은 참고가 되었으면 좋겠습니다! 궁금한 점이 있으시다면 언제든 댓글로 편하게 물어봐주세요. 감사합니다!"
];

// TODO(API): GET /api/community/posts/{id}로 교체, mock 제거(A1). id 1=Figma 확정, 나머지 mock
export const MOCK_POST_DETAILS: Record<string, CommunityPostDetail> = {
  "1": { id: "1", category: "인테리어", handle: "@minji_home", date: "2024.01.15", views: 1234, title: "84㎡ LH 아파트 입주 후 거실 꾸미기", likes: 342, commentCount: 58, body: POST1_BODY, comments: COMMENTS },
  "2": { id: "2", category: "가구", handle: "@nordic_room", date: "2024.01.14", views: 2103, title: "바움 스튜디오 소파 도착 — 개봉기 & 솔직 후기", likes: 876, commentCount: 131, body: ["기다리던 바움 스튜디오 소파가 도착했습니다. 배송부터 개봉, 조립까지 후기를 남겨요.", "쿠션감과 마감 모두 만족스러웠어요. 원목 다리도 튼튼합니다."], comments: COMMENTS },
  "3": { id: "3", category: "Q&A", handle: "@apt_diaries", date: "2024.01.13", views: 1502, title: "청약 공고의 경쟁률은 어떻게 보나요?", likes: 512, commentCount: 93, body: ["청약 공고에서 경쟁률을 확인하는 방법이 궁금합니다. 어디를 봐야 하나요?"], comments: COMMENTS },
  h1: { id: "h1", category: "팁", handle: "@seoulstylist", date: "2024.01.16", views: 5820, title: "마포 상암 SH 청약 팁 — 첫 도전에 당첨됐어요!", likes: 1240, commentCount: 204, body: ["첫 청약 도전에 당첨된 후기와 팁을 공유합니다.", "가점 관리와 공고 분석이 핵심이었어요."], comments: COMMENTS }
};
