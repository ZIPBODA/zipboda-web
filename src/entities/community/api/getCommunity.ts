import { MOCK_POSTS, MOCK_HERO } from "./__mocks__/community.mock";
import type { CommunityPost, CommunityHero } from "../model/types";

// TODO(API): GET /api/community/posts로 교체, mock 제거(A1)
export async function getCommunityPosts(category?: string): Promise<CommunityPost[]> {
  if (!category || category === "전체") return MOCK_POSTS;
  return MOCK_POSTS.filter((p) => p.category === category);
}

export async function getCommunityHero(): Promise<CommunityHero> {
  return MOCK_HERO;
}
