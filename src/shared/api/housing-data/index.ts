import catalog from "./catalog.json";
import geocode from "./geocode.json";

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
