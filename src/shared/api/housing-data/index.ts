import catalog from "./catalog.json";
import geocode from "./geocode.json";
import notice from "./notice.json";

export const HOUSING_SOURCE_DATA = catalog;

/**
 * 주소를 좌표로 바꾼 결과. scripts/geocode-housing.ts가 한 번만 만들고 서비스는 읽기만 한다.
 * catalog.json은 원본 PDF에서 매번 다시 만들어지므로 좌표는 여기 따로 둔다.
 */
export interface HousingGeocode {
  propertyId: string;
  lat: number;
  lng: number;
  method: "kakao-address" | "manual";
  queryAddress: string;
  resolvedAddress: string | null;
  region1: string | null;
  region2: string | null;
  geocodedAt: string;
}

export const HOUSING_GEOCODES = geocode as HousingGeocode[];

/**
 * 공고 정보. 현황도 PDF에는 도면과 주소만 있고 모집·일정은 공고문에 있어 여기 따로 둔다.
 * catalog.json은 PDF에서 매번 다시 만들어지므로 섞지 않는다. 날짜는 모두 KST 기준 YYYY-MM-DD.
 */
export interface HousingNotice {
  propertyId: string;
  /** 공급기관. 현황도 PDF에는 표기가 없어 공고문 기준으로 여기 둔다 */
  agency: string;
  /** 이번 공고로 공급하는 호수 */
  supplyUnits: number;
  /** 예비입주자를 포함한 모집 인원 */
  recruitCount: number;
  applicationCount: number;
  postDate: string;
  applyStart: string;
  applyEnd: string;
  contractDate: string;
  /** 입주 예정 달. YYYY-MM */
  moveIn: string;
  applyUrl: string;
}

export const HOUSING_NOTICES = notice as HousingNotice[];
