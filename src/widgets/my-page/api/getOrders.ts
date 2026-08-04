import { MOCK_ORDERS } from "./__mocks__/myPage.mock";
import type { Order } from "../model/types";

// TODO(API): GET /api/my/orders로 교체, mock 제거(A1)
export async function getOrders(): Promise<Order[]> {
  return MOCK_ORDERS;
}
