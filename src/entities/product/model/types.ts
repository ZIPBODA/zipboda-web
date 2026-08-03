export interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  /** 할인 전 가격·할인율·평점은 커머스 목록(메인 '인기 가구')에서만 노출된다 */
  originalPrice?: number;
  discountRate?: number;
  rating?: number;
  reviewCount?: number;
}
