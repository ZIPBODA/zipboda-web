import { MOCK_WISHLIST } from "./__mocks__/myPage.mock";
import type { WishlistItem } from "../model/types";

// TODO(API): GET /api/my/wishlist로 교체, mock 제거(A1)
export async function getWishlist(): Promise<WishlistItem[]> {
  return MOCK_WISHLIST;
}
