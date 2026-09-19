export type MyListingStatus = "신청함" | "관심등록" | "저장됨";

export interface MyProfileStat {
  label: string;
  value: number;
}

export interface MyProfile {
  name: string;
  /** 프로필 사진. 없으면 회색 자리로 둔다 */
  avatar?: string;
  email: string;
  region: string;
  verified: boolean;
  stats: MyProfileStat[];
}

export interface MyListing {
  id: string;
  title: string;
  size: number;
  status: MyListingStatus;
  dday: number;
  applyUrl: string;
  applied: boolean;
}

export interface MyPageData {
  profile: MyProfile;
  listings: MyListing[];
}

export interface WishlistItem {
  id: string;
  brand: string;
  name: string;
  discount: number;
  price: number;
  originalPrice: number;
  image: string;
}

export type OrderStatus = "배송완료" | "배송중" | "준비중";

export interface Order {
  id: string;
  brand: string;
  name: string;
  orderDate: string;
  price: number;
  status: OrderStatus;
  image: string;
}

export interface ProfileEditData {
  nickname: string;
  /** 프로필 사진. 변경 기능은 API 연동 전이라 지금은 보여 주기만 한다 */
  avatar?: string;
  email: string;
  phone: string;
  bio: string;
  interests: string[];
}
