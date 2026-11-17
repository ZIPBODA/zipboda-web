import { describe, expect, it } from "vitest";
import type { SubscriptionDetailDto, SubscriptionListItemDto, SubscriptionUnitDto } from "./subscription.dto";
import { toFilterOptions, toFilterQuery, toSubscription, toSubscriptionDetail } from "./subscriptionMapper";

const listItem: SubscriptionListItemDto = {
  id: "cell-1",
  title: "강남개포동(T&K개포)",
  noticeTitle: "[서울지역본부] 26년 3차 청년 매입임대주택 예비입주자 모집공고",
  agencyCode: 1,
  region: 1,
  address: "서울특별시 강남구 논현로12길 23-5",
  lat: 37.47,
  lng: 127.04,
  supplyType: "청년매입임대",
  sizes: [17.52, 28.81],
  households: 13,
  applicationCount: 691,
  competition: "230.3:1",
  moveIn: "2026-11",
  deadline: "2026-09-11",
  dday: 3,
  statusCode: 2,
  imageUrl: "/housing/gangnam-gaepo/exterior.png"
};

const unit = (overrides: Partial<SubscriptionUnitDto>): SubscriptionUnitDto => ({
  size: null, type: null, label: null, floor: null, unitNumber: null, exclusiveArea: null, households: null, price: null, ...overrides
});

const detail: SubscriptionDetailDto = {
  ...listItem,
  agencyName: "한국토지주택공사",
  postDate: "2026-08-24",
  applyStartDate: "2026-09-07",
  contractDate: "2026-10-05",
  supplyUnits: 3,
  recruitCount: 9,
  units: [],
  applyUrl: "https://apply.lh.or.kr",
  floorplans: []
};

describe("주소 필터 → API 조건", () => {
  it("이름을 ITF 코드로 바꾸고 검색어의 공백을 정리한다", () => {
    expect(toFilterQuery({ region: "경기", agency: "GH", status: "접수예정", size: "20-25", q: "  광교   센트레빌 " })).toEqual({
      region: 3, agency: 3, status: 1, size: "20-25", keyword: "광교 센트레빌"
    });
  });

  // API는 정의 밖 값을 422로 막는다 — 그대로 넘기면 예전 링크가 빈 목록이 아니라 오류 화면이 된다
  it("'전체'·모르는 값·빈 검색어는 조건을 걸지 않는다", () => {
    expect(toFilterQuery({ region: "전체", agency: "XX", status: "모집중", size: "39", q: "   " })).toEqual({
      region: undefined, agency: undefined, status: undefined, size: undefined, keyword: undefined
    });
  });

  it("검색어는 API 상한(100자)까지만 보낸다", () => {
    expect(toFilterQuery({ q: "가".repeat(150) }).keyword).toHaveLength(100);
  });
});

describe("목록 한 칸", () => {
  it("코드를 화면 이름으로, 날짜를 화면 표기로 바꾼다", () => {
    expect(toSubscription(listItem)).toEqual({
      status: "접수중",
      supplyType: "청년매입임대",
      id: "cell-1",
      agency: "LH",
      title: "강남개포동(T&K개포)",
      region: "서울",
      location: "서울특별시 강남구 논현로12길 23-5",
      coord: { lat: 37.47, lng: 127.04 },
      sizes: [17.52, 28.81],
      applicants: 691,
      households: 13,
      competition: "230.3:1",
      moveIn: "2026년 11월",
      deadline: "2026년 9월 11일",
      dday: 3,
      image: "/housing/gangnam-gaepo/exterior.png"
    });
  });

  it("화면이 그릴 수 없는 사진 주소(허용 목록 밖)는 사진 없음이다", () => {
    expect(toSubscription({ ...listItem, imageUrl: "https://apply.lh.or.kr/lhapply/lhImageView2.do?fileid=1" }).image).toBeNull();
    expect(toSubscription({ ...listItem, imageUrl: "https://apply.lh.or.kr/upload/Files/a.jpg" }).image).toBe("https://apply.lh.or.kr/upload/Files/a.jpg");
  });

  it("좌표·일정·상태가 없으면 비워 둔다", () => {
    const empty = toSubscription({ ...listItem, lat: null, moveIn: null, deadline: null, statusCode: null, dday: null });
    expect(empty).toMatchObject({ coord: null, moveIn: null, deadline: null, status: null, dday: null });
  });
});

describe("공고 상세", () => {
  it("일정은 화면 표기로, 세대 수는 '세대'를 붙이고, 기관은 약칭으로 보인다", () => {
    expect(toSubscriptionDetail(detail)).toMatchObject({
      agency: "LH",
      agencyLabel: "LH",
      status: "접수중",
      applyPeriod: "2026.09.07 ~ 2026.09.11",
      households: "13세대",
      contractDate: "2026년 10월 5일",
      postDate: "2026년 8월 24일",
      moveIn: "2026년 11월",
      image: "/housing/gangnam-gaepo/exterior.png",
      units: [],
      defaultUnitKey: undefined,
      defaultUnitSize: null
    });
  });

  it("평면도가 있으면 도면 하나가 고를 수 있는 호 하나다 — 열쇠는 도면 id, 이름은 층·호·타입", () => {
    const withPlans = toSubscriptionDetail({
      ...detail,
      units: [unit({ label: "28" })],
      floorplans: [
        { id: "gangnam-gaepo-2-3-01", size: "28", type: null, floor: "2-3", unitNumber: "01", exclusiveArea: 28.81, image2dUrl: "/plan-01.png", has2d: true, has3d: true },
        { id: "gangnam-gaepo-5-502-drawing", size: "17", type: "A", floor: "5", unitNumber: "502-drawing", exclusiveArea: 17.52, image2dUrl: null, has2d: false, has3d: false }
      ]
    });
    expect(withPlans.units).toEqual([
      { unitKey: "gangnam-gaepo-2-3-01", layoutKey: "gangnam-gaepo-2-3-01", label: "2~3층 01호", floor: "2-3", unit: "01", size: 28.81, type: "", image2dUrl: "/plan-01.png", has3d: true },
      { unitKey: "gangnam-gaepo-5-502-drawing", layoutKey: "gangnam-gaepo-5-502-drawing", label: "5층 502호 A타입", floor: "5", unit: "502-drawing", size: 17.52, type: "A", image2dUrl: null, has3d: false }
    ]);
    expect(withPlans).toMatchObject({ defaultUnitKey: "gangnam-gaepo-2-3-01", defaultUnitSize: 28.81 });
  });

  it("평면도가 없으면 주택형을 고른다 — 원천 표기가 열쇠이고, 겹치면 순번을 붙여 가른다", () => {
    const housing = toSubscriptionDetail({
      ...detail,
      units: [
        unit({ label: "59A", size: "59", type: "A", exclusiveArea: 59.98 }),
        unit({ label: "59A", size: "59", type: "A", exclusiveArea: 59.98 }),
        unit({ floor: "4층", unitNumber: "402", exclusiveArea: 26.5 }),
        unit({ label: "70~80㎡" }),
        unit({})
      ]
    });
    expect(housing.units.map(({ unitKey, label, size, layoutKey }) => ({ unitKey, label, size, layoutKey }))).toEqual([
      { unitKey: "59A", label: "59A", size: 59.98, layoutKey: undefined },
      { unitKey: "59A (2)", label: "59A", size: 59.98, layoutKey: undefined },
      { unitKey: "4층 402호", label: "4층 402호", size: 26.5, layoutKey: undefined },
      { unitKey: "70~80㎡", label: "70~80㎡", size: null, layoutKey: undefined },
      { unitKey: "5", label: undefined, size: null, layoutKey: undefined }
    ]);
  });

  it("접수 시작이나 마감을 모르면 신청 기간을 지어내지 않는다", () => {
    expect(toSubscriptionDetail({ ...detail, applyStartDate: null }).applyPeriod).toBeNull();
  });
});

describe("필터 선택지", () => {
  it("코드를 이름으로 바꿔 '전체' 뒤에 두고, 모르는 코드와 이름표가 없는 구간은 버린다", () => {
    expect(toFilterOptions({
      regions: [1, 3, 9],
      agencies: [1, 2],
      statuses: [1, 2, 3],
      sizeRanges: [{ value: "0-15", min: 0, max: 15 }, { value: "30-", min: 30, max: null }, { value: "99-", min: 99, max: null }]
    })).toEqual({
      statuses: ["접수예정", "접수중", "마감"],
      regions: ["전체", "서울", "경기"],
      agencies: ["전체", "LH", "SH"],
      sizeRanges: [{ value: "전체", label: "전체" }, { value: "0-15", label: "~15㎡" }, { value: "30-", label: "30㎡~" }]
    });
  });
});
