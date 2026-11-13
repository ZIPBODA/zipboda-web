/** zipboda-api 응답 원본(src/modules/subscription/dto). 날짜는 YYYY-MM-DD, 입주는 YYYY-MM이다 */

export interface SubscriptionListItemDto {
  id: string;
  title: string;
  noticeTitle: string;
  agencyCode: number;
  region: number;
  address: string;
  lat: number | null;
  lng: number | null;
  supplyType: string | null;
  sizes: number[];
  households: number | null;
  applicationCount: number | null;
  competition: string | null;
  moveIn: string | null;
  deadline: string | null;
  dday: number | null;
  statusCode: number | null;
  imageUrl: string | null;
}

export interface SubscriptionListDto {
  items: SubscriptionListItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface SubscriptionMapDto {
  markers: SubscriptionListItemDto[];
  totalCount: number;
}

export interface SubscriptionSearchDto {
  page: number;
  pageSize: number;
  subscriptions: { items: SubscriptionListItemDto[]; totalCount: number };
}

export interface SubscriptionFilterOptionsDto {
  regions: number[];
  agencies: number[];
  statuses: number[];
  sizeRanges: { value: string; min: number; max: number | null }[];
}

export interface SubscriptionUnitDto {
  size: string | null;
  type: string | null;
  label: string | null;
  floor: string | null;
  unitNumber: string | null;
  exclusiveArea: number | null;
  households: number | null;
  price: string | null;
}

export interface SubscriptionFloorplanDto {
  id: string;
  size: string | null;
  type: string | null;
  floor: string | null;
  unitNumber: string | null;
  exclusiveArea: number | null;
  image2dUrl: string | null;
  has2d: boolean;
  has3d: boolean;
}

export interface SubscriptionDetailDto {
  id: string;
  title: string;
  noticeTitle: string;
  agencyCode: number;
  agencyName: string;
  statusCode: number | null;
  dday: number | null;
  region: number;
  address: string;
  lat: number | null;
  lng: number | null;
  postDate: string | null;
  applyStartDate: string | null;
  deadline: string | null;
  contractDate: string | null;
  supplyType: string | null;
  households: number | null;
  supplyUnits: number | null;
  recruitCount: number | null;
  applicationCount: number | null;
  moveIn: string | null;
  competition: string | null;
  imageUrl: string | null;
  units: SubscriptionUnitDto[];
  applyUrl: string | null;
  floorplans: SubscriptionFloorplanDto[];
}
