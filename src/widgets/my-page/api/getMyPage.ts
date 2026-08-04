import { MOCK_PROFILE, MOCK_MY_LISTINGS } from "./__mocks__/myPage.mock";
import type { MyPageData } from "../model/types";

// TODO(API): GET /api/my (프로필·관심/구독 공고)로 교체, mock 제거(A1)
export async function getMyPage(): Promise<MyPageData> {
  return { profile: MOCK_PROFILE, listings: MOCK_MY_LISTINGS };
}
