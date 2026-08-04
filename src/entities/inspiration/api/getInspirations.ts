import { MOCK_INSPIRATIONS } from "./__mocks__/inspirations.mock";
import type { InspirationItem } from "../model/types";

// TODO(API): GET /api/inspirations로 교체, mock 제거(A1)
export async function getInspirations(category?: string): Promise<InspirationItem[]> {
  if (!category || category === "전체") return MOCK_INSPIRATIONS;
  return MOCK_INSPIRATIONS.filter((i) => i.category === category);
}
