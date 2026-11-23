import type { ApiQuery } from "@/shared/api/types";
import { displayableImageOf } from "@/shared/lib/imageSrc";
import { cleanQuery } from "@/shared/lib/searchQuery";
import {
  AGENCY_API_CODES,
  DEFAULT_SORT,
  DRAWING_UNIT_SUFFIX,
  FILTER_ALL,
  KEYWORD_MAX_LENGTH,
  MAP_ITEM_COORD_DECIMALS,
  REGION_API_CODES,
  SIZE_RANGE_OPTIONS,
  SORT_OPTIONS,
  STATUS_API_CODES
} from "../config/constants";
import { formatApplyPeriod, formatNoticeDate, formatNoticeMonth } from "../lib/noticeSchedule";
import type {
  Subscription,
  SubscriptionDetail,
  SubscriptionFilter,
  SubscriptionFilterOptions,
  SubscriptionMapItem,
  SubscriptionPage,
  SubscriptionSort,
  SubscriptionUnit
} from "../model/types";
import type {
  SubscriptionDetailDto,
  SubscriptionFilterOptionsDto,
  SubscriptionFloorplanDto,
  SubscriptionListDto,
  SubscriptionListItemDto,
  SubscriptionUnitDto
} from "./subscription.dto";

type CodeTable<Name extends string> = readonly { name: Name; code: number }[];

const nameOf = <Name extends string>(table: CodeTable<Name>, code: number | null): Name | null =>
  table.find((entry) => entry.code === code)?.name ?? null;

const codeOf = <Name extends string>(table: CodeTable<Name>, name: string | undefined): number | undefined =>
  table.find((entry) => entry.name === name)?.code;

const namesOf = <Name extends string>(table: CodeTable<Name>, codes: number[]): Name[] =>
  codes.flatMap((code) => {
    const name = nameOf(table, code);
    return name === null ? [] : [name];
  });

const dateOrNull = (isoDate: string | null) => (isoDate === null ? null : formatNoticeDate(isoDate));
const monthOrNull = (isoMonth: string | null) => (isoMonth === null ? null : formatNoticeMonth(isoMonth));
const coordOf = (lat: number | null, lng: number | null) => (lat === null || lng === null ? null : { lat, lng });

export const sortOf = (value: string | undefined): SubscriptionSort =>
  SORT_OPTIONS.find((option) => option.value === value)?.value ?? DEFAULT_SORT;

/**
 * 주소에 담긴 필터를 API 조건으로 바꾼다. '전체'나 모르는 값(예전 링크·오타)은 조건을 걸지 않는다 —
 * API는 정의 밖 값을 422로 막아, 그대로 넘기면 빈 목록이 아니라 오류 화면이 된다
 */
export const toFilterQuery = (filter: Partial<SubscriptionFilter>): ApiQuery => {
  // 서버 액션은 누구나 부를 수 있어 검색어가 글자가 아닐 수 있다 — 모르는 값처럼 조건을 걸지 않는다
  const keyword = (typeof filter.q === "string" ? cleanQuery(filter.q) : "").slice(0, KEYWORD_MAX_LENGTH);
  return {
    region: codeOf(REGION_API_CODES, filter.region),
    agency: codeOf(AGENCY_API_CODES, filter.agency),
    status: codeOf(STATUS_API_CODES, filter.status),
    size: SIZE_RANGE_OPTIONS.some((range) => range.value === filter.size) ? filter.size : undefined,
    keyword: keyword || undefined
  };
};

export const toSubscription = (dto: SubscriptionListItemDto): Subscription => ({
  status: nameOf(STATUS_API_CODES, dto.statusCode),
  supplyType: dto.supplyType,
  id: dto.id,
  agency: nameOf(AGENCY_API_CODES, dto.agencyCode),
  title: dto.title,
  region: nameOf(REGION_API_CODES, dto.region) ?? "",
  location: dto.address,
  coord: coordOf(dto.lat, dto.lng),
  sizes: dto.sizes,
  applicants: dto.applicationCount,
  households: dto.households,
  competition: dto.competition,
  moveIn: monthOrNull(dto.moveIn),
  deadline: dateOrNull(dto.deadline),
  dday: dto.dday,
  image: displayableImageOf(dto.imageUrl)
});

const roundCoordinate = (value: number) => Number(value.toFixed(MAP_ITEM_COORD_DECIMALS));

// 지도는 핀 1천여 개를 서버에서 한 번에 바꾸므로 쓰는 칸만 바로 옮긴다
export const toSubscriptionMapItem = (dto: SubscriptionListItemDto): SubscriptionMapItem => ({
  id: dto.id,
  agency: nameOf(AGENCY_API_CODES, dto.agencyCode),
  status: nameOf(STATUS_API_CODES, dto.statusCode),
  title: dto.title,
  location: dto.address,
  coord: dto.lat === null || dto.lng === null ? null : { lat: roundCoordinate(dto.lat), lng: roundCoordinate(dto.lng) },
  sizes: dto.sizes,
  households: dto.households,
  deadline: dateOrNull(dto.deadline),
  dday: dto.dday,
  image: displayableImageOf(dto.imageUrl)
});

export const toSubscriptionPage = (dto: SubscriptionListDto): SubscriptionPage => ({
  items: dto.items.map(toSubscription),
  page: dto.page,
  pageSize: dto.pageSize,
  totalCount: dto.totalCount
});

const floorplanLabelOf = (plan: SubscriptionFloorplanDto): string => {
  const floor = plan.floor ? `${plan.floor.replace("-", "~")}층` : null;
  const unit = plan.unitNumber ? `${plan.unitNumber.replace(DRAWING_UNIT_SUFFIX, "")}호` : null;
  const type = plan.type ? `${plan.type}타입` : null;
  return [floor, unit, type].filter(Boolean).join(" ");
};

/** 평면도가 있는 단지는 도면 하나가 고를 수 있는 호 하나다. 열쇠가 도면 id라 도면 자산을 바로 찾는다 */
const toFloorplanUnit = (plan: SubscriptionFloorplanDto): SubscriptionUnit => ({
  unitKey: plan.id,
  layoutKey: plan.id,
  label: floorplanLabelOf(plan) || undefined,
  floor: plan.floor ?? undefined,
  unit: plan.unitNumber ?? undefined,
  size: plan.exclusiveArea,
  type: plan.type ?? "",
  image2dUrl: displayableImageOf(plan.image2dUrl),
  has3d: plan.has3d
});

const housingUnitLabelOf = (unit: SubscriptionUnitDto): string | undefined => {
  if (unit.label) return unit.label;
  const label = [unit.floor, unit.unitNumber ? `${unit.unitNumber}호` : null].filter(Boolean).join(" ");
  return label || undefined;
};

/**
 * 평면도가 없으면 공고의 주택형을 고른다. 주소(?unit=)에 남는 열쇠라 순번이 아니라 원천 표기로 만들고,
 * 같은 표기가 겹치면(같은 이름의 주택형) 순번을 덧붙여 가른다 — '#'은 주소의 조각 표시라 쓰지 않는다
 */
const toHousingUnits = (units: SubscriptionUnitDto[]): SubscriptionUnit[] => {
  const used = new Set<string>();
  return units.map((unit, index) => {
    const label = housingUnitLabelOf(unit);
    const base = label ?? (unit.exclusiveArea === null ? String(index + 1) : String(unit.exclusiveArea));
    const unitKey = used.has(base) ? `${base} (${index + 1})` : base;
    used.add(unitKey);
    return {
      unitKey,
      label,
      floor: unit.floor ?? undefined,
      unit: unit.unitNumber ?? undefined,
      size: unit.exclusiveArea,
      type: unit.type ?? ""
    };
  });
};

export const toSubscriptionDetail = (dto: SubscriptionDetailDto): SubscriptionDetail => {
  const units = dto.floorplans.length > 0 ? dto.floorplans.map(toFloorplanUnit) : toHousingUnits(dto.units);
  const agency = nameOf(AGENCY_API_CODES, dto.agencyCode);
  return {
    id: dto.id,
    agency,
    agencyLabel: agency ?? dto.agencyName,
    status: nameOf(STATUS_API_CODES, dto.statusCode),
    title: dto.title,
    address: dto.address,
    coord: coordOf(dto.lat, dto.lng),
    dday: dto.dday,
    applyPeriod:
      dto.applyStartDate && dto.deadline ? formatApplyPeriod({ applyStart: dto.applyStartDate, applyEnd: dto.deadline }) : null,
    households: dto.households === null ? null : `${dto.households}세대`,
    supplyUnits: dto.supplyUnits,
    recruitCount: dto.recruitCount,
    supplyType: dto.supplyType,
    competition: dto.competition,
    contractDate: dateOrNull(dto.contractDate),
    moveIn: monthOrNull(dto.moveIn),
    postDate: dateOrNull(dto.postDate),
    image: displayableImageOf(dto.imageUrl),
    applyUrl: dto.applyUrl,
    units,
    defaultUnitKey: units[0]?.unitKey,
    defaultUnitSize: units[0]?.size ?? null
  };
};

/** 표시 이름은 web이 정한다 — API는 코드와 면적 구간 값만 준다 */
export const toFilterOptions = (dto: SubscriptionFilterOptionsDto): SubscriptionFilterOptions => ({
  statuses: namesOf(STATUS_API_CODES, dto.statuses),
  regions: [FILTER_ALL, ...namesOf(REGION_API_CODES, dto.regions)],
  agencies: [FILTER_ALL, ...namesOf(AGENCY_API_CODES, dto.agencies)],
  sizeRanges: [
    { value: FILTER_ALL, label: FILTER_ALL },
    ...SIZE_RANGE_OPTIONS.filter((option) => dto.sizeRanges.some((range) => range.value === option.value))
  ]
});
