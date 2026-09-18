import { HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import type { AgencyCode, Subscription, SubscriptionDetail } from "../model/types";

const agencyCode = (value: string | null): AgencyCode | null => value === "LH" || value === "SH" || value === "GH" || value === "IH" ? value : null;

export const SUBSCRIPTION_DETAILS: SubscriptionDetail[] = HOUSING_SOURCE_DATA.map((property) => ({
  id: property.id,
  title: property.title,
  address: property.address,
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
  region: "서울",
  location: property.address,
  sizes: [...new Set(property.layouts.flatMap((layout) => layout.exclusiveAreaM2 === null ? [] : [layout.exclusiveAreaM2]))].sort((a, b) => a - b),
  applicants: null,
  households: property.households,
  competition: null,
  moveIn: null,
  deadline: null,
  dday: null,
  image: property.image
}));
