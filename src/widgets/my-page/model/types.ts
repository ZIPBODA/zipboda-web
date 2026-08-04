export type MyListingStatus = "신청함" | "관심등록" | "저장됨";

export interface MyProfileStat {
  label: string;
  value: number;
}

export interface MyProfile {
  name: string;
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
}

export type OrderStatus = "배송완료" | "배송중" | "준비중";

export interface Order {
  id: string;
  brand: string;
  name: string;
  orderDate: string;
  price: number;
  status: OrderStatus;
}

export interface ProfileEditData {
  nickname: string;
  email: string;
  phone: string;
  bio: string;
  interests: string[];
}
