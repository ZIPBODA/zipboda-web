import { HOUSING_GEOCODES, HOUSING_NOTICES, HOUSING_SOURCE_DATA } from "@/shared/api/housing-data";
import { DEFAULT_REGION } from "../config/constants";
import {
  formatApplyPeriod,
  formatCompetition,
  formatNoticeDate,
  formatNoticeMonth,
  noticeDday,
  noticeStatus
} from "../lib/noticeSchedule";
import type { AgencyCode, Subscription, SubscriptionDetail } from "../model/types";

const agencyCode = (value: string | null): AgencyCode | null => value === "LH" || value === "SH" || value === "GH" || value === "IH" ? value : null;

// 주택 수가 늘어도 매번 훑지 않도록 한 번만 색인한다
const GEOCODE_BY_ID = new Map(HOUSING_GEOCODES.map((entry) => [entry.propertyId, entry]));
const NOTICE_BY_ID = new Map(HOUSING_NOTICES.map((entry) => [entry.propertyId, entry]));

/**
 * 남은 날짜는 모듈을 읽는 시점의 오늘로 계산한다.
 * 목 데이터라 서버가 다시 뜨는 주기면 충분하고, 요청마다 다시 세지 않아 목록 정렬이 한 응답 안에서 흔들리지 않는다.
 */
const TODAY = new Date();


const coordOf = (propertyId: string) => {
  const found = GEOCODE_BY_ID.get(propertyId);
  return found ? { lat: found.lat, lng: found.lng } : null;
};

/** 지오코딩이 돌려준 시·도를 쓰고, 아직 없으면 현재 수집 범위인 서울로 둔다 */
const regionOf = (propertyId: string) => GEOCODE_BY_ID.get(propertyId)?.region1 ?? DEFAULT_REGION;

export const SUBSCRIPTION_DETAILS: SubscriptionDetail[] = HOUSING_SOURCE_DATA.map((property) => {
  const notice = NOTICE_BY_ID.get(property.id) ?? null;
  return {
  id: property.id,
  title: property.title,
  address: property.address,
  coord: coordOf(property.id),
  agency: agencyCode(property.agency ?? notice?.agency ?? null),
  agencyLabel: property.agency ?? notice?.agency ?? "",
  status: notice && noticeStatus(notice, TODAY),
  dday: notice && noticeDday(notice, TODAY),
  applyPeriod: notice && formatApplyPeriod(notice),
  households: property.households === null ? null : `${property.households}세대`,
  supplyUnits: notice?.supplyUnits ?? null,
  recruitCount: notice?.recruitCount ?? null,
  supplyType: property.housingType,
  competition: notice && formatCompetition(notice.applicationCount, notice.supplyUnits),
  contractDate: notice && formatNoticeDate(notice.contractDate),
  moveIn: notice && formatNoticeMonth(notice.moveIn),
  postDate: notice && formatNoticeDate(notice.postDate),
  image: property.image,
  applyUrl: notice?.applyUrl ?? null,
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
  };
});

export const SUBSCRIPTIONS: Subscription[] = HOUSING_SOURCE_DATA.map((property) => {
  const notice = NOTICE_BY_ID.get(property.id) ?? null;
  return {
    id: property.id,
    title: property.title,
    agency: agencyCode(property.agency ?? notice?.agency ?? null),
    region: regionOf(property.id),
    location: property.address,
    coord: coordOf(property.id),
    sizes: [...new Set(property.layouts.flatMap((layout) => layout.exclusiveAreaM2 === null ? [] : [layout.exclusiveAreaM2]))].sort((a, b) => a - b),
    applicants: notice?.applicationCount ?? null,
    households: property.households,
    competition: notice && formatCompetition(notice.applicationCount, notice.supplyUnits),
    moveIn: notice && formatNoticeMonth(notice.moveIn),
    deadline: notice && formatNoticeDate(notice.applyEnd),
    dday: notice && noticeDday(notice, TODAY),
    image: property.image
  };
});
