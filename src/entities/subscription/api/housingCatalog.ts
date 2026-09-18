import { HOUSING_GEOCODES, HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { DEFAULT_REGION } from "../config/constants";
import type { AgencyCode, Subscription, SubscriptionDetail } from "../model/types";

const agencyCode = (value: string | null): AgencyCode | null => value === "LH" || value === "SH" || value === "GH" || value === "IH" ? value : null;

// 주택 수가 늘어도 매번 훑지 않도록 한 번만 색인한다
const GEOCODE_BY_ID = new Map(HOUSING_GEOCODES.map((entry) => [entry.propertyId, entry]));

const coordOf = (propertyId: string) => {
  const found = GEOCODE_BY_ID.get(propertyId);
  return found ? { lat: found.lat, lng: found.lng } : null;
};

/** 지오코딩이 돌려준 시·도를 쓰고, 아직 없으면 현재 수집 범위인 서울로 둔다 */
const regionOf = (propertyId: string) => GEOCODE_BY_ID.get(propertyId)?.region1 ?? DEFAULT_REGION;

export const SUBSCRIPTION_DETAILS: SubscriptionDetail[] = HOUSING_SOURCE_DATA.map((property) => ({
  id: property.id,
  title: property.title,
  address: property.address,
  coord: coordOf(property.id),
  agency: agencyCode(property.agency),
  agencyLabel: property.agency ?? "",
  status: null,
  dday: null,
  applyPeriod: null,
  households: property.households === null ? null : `${property.households}세대`,
  supplyType: property.housingType,
  competition: null,
  contractDate: null,
  moveIn: null,
  postDate: null,
  image: property.image,
  applyUrl: null,
  sourcePdf: property.sourcePdf,
  sourceIssues: property.issues,
  units: property.layouts.map((layout) => ({
    unitKey: layout.unitKey,
    layoutKey: layout.layoutKey,
    label: `${layout.floor.replace("-", "~")}층 ${layout.unit.replace("-drawing", "")}호${layout.type ? ` ${layout.type}타입` : ""}`,
    floor: layout.floor,
    unit: layout.unit,
    size: layout.exclusiveAreaM2,
    type: layout.type ?? ""
  })),
  defaultUnitKey: property.layouts[0]?.unitKey,
  defaultUnitSize: property.layouts[0]?.exclusiveAreaM2 ?? null
}));

export const SUBSCRIPTIONS: Subscription[] = HOUSING_SOURCE_DATA.map((property) => ({
  id: property.id,
  title: property.title,
  agency: agencyCode(property.agency),
  region: regionOf(property.id),
  location: property.address,
  coord: coordOf(property.id),
  sizes: [...new Set(property.layouts.flatMap((layout) => layout.exclusiveAreaM2 === null ? [] : [layout.exclusiveAreaM2]))].sort((a, b) => a - b),
  applicants: null,
  households: property.households,
  competition: null,
  moveIn: null,
  deadline: null,
  dday: null,
  image: property.image
}));
