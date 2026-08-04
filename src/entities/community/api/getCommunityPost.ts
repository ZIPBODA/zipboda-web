import { MOCK_POST_DETAILS } from "./__mocks__/communityDetails.mock";
import type { CommunityPostDetail } from "../model/types";

// TODO(API): GET /api/community/posts/{id}로 교체, mock 제거(A1)
export async function getCommunityPost(id: string): Promise<CommunityPostDetail | null> {
  return MOCK_POST_DETAILS[id] ?? null;
}
