import { MOCK_PROFILE_EDIT } from "./__mocks__/myPage.mock";
import type { ProfileEditData } from "../model/types";

// TODO(API): GET /api/my/profile로 교체, mock 제거(A1)
export async function getProfileEdit(): Promise<ProfileEditData> {
  return MOCK_PROFILE_EDIT;
}
