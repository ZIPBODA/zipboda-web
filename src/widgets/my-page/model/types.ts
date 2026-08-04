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
