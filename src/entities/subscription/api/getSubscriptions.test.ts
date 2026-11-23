import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSubscriptionDetail } from "./getSubscriptionDetail";
import { getSubscriptionMapItems } from "./getSubscriptionMapItems";
import { getSubscriptions } from "./getSubscriptions";
import { searchSubscriptions } from "./searchSubscriptions";
import type { SubscriptionListItemDto } from "./subscription.dto";

const item = (id: string, lat: number | null = null): SubscriptionListItemDto => ({
  id, title: `단지 ${id}`, noticeTitle: `공고 ${id}`, agencyCode: 1, region: 1, address: "서울 노원구", lat, lng: lat === null ? null : 127,
  supplyType: null, sizes: [], households: null, applicationCount: null, competition: null, moveIn: null, deadline: null, dday: null, statusCode: 3, imageUrl: null
});

const envelope = (data: unknown) => ({ success: true, data, error: null });
const failure = (status: number, message: string) =>
  new Response(JSON.stringify({ success: false, data: null, error: { code: "E000", message } }), { status });

let fetchMock: ReturnType<typeof vi.fn<(url: string) => Promise<Response>>>;
const requested = () => new URL(fetchMock.mock.calls[0][0]);
const answer = (data: unknown) => fetchMock.mockResolvedValue(new Response(JSON.stringify(envelope(data))));

beforeEach(() => {
  vi.stubEnv("ZIPBODA_API_URL", "http://api.test/api");
  fetchMock = vi.fn<(url: string) => Promise<Response>>();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("목록(API-010)", () => {
  it("주소 필터를 코드로 바꿔 정렬·페이지와 함께 묻고, 전체 건수를 함께 준다", async () => {
    answer({ items: [item("a"), item("b")], page: 2, pageSize: 20, totalCount: 42 });
    const page = await getSubscriptions({ region: "서울", agency: "LH", sort: "COMPETITION", q: "노원" }, { page: 2 });
    expect(requested().pathname).toBe("/api/subscriptions");
    expect(Object.fromEntries(requested().searchParams)).toEqual({ region: "1", agency: "1", keyword: "노원", sort: "COMPETITION", page: "2", pageSize: "20" });
    expect(page).toMatchObject({ page: 2, pageSize: 20, totalCount: 42 });
    expect(page.items.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("모르는 정렬은 기본 정렬(마감 임박)로 묻는다", async () => {
    answer({ items: [], page: 1, pageSize: 20, totalCount: 0 });
    await getSubscriptions({ sort: "POPULAR" as never });
    expect(requested().searchParams.get("sort")).toBe("DEADLINE");
  });
});

describe("지도(API-012)", () => {
  it("영역 없이 같은 조건·정렬로 핀을 받고, 좌표가 없는 공고까지 센 건수를 함께 준다", async () => {
    answer({ markers: [item("a", 37.5)], totalCount: 7 });
    const result = await getSubscriptionMapItems({ status: "접수중", sort: "HOUSEHOLDS" });
    expect(requested().pathname).toBe("/api/subscriptions/map");
    expect(Object.fromEntries(requested().searchParams)).toEqual({ status: "2", sort: "HOUSEHOLDS" });
    expect(result.totalCount).toBe(7);
    expect(result.items[0]).toMatchObject({ id: "a", coord: { lat: 37.5, lng: 127 } });
  });

  // 지도는 핀 전부를 문서에 싣는다 — 지도 화면이 쓰지 않는 칸과 지나친 좌표 자릿수는 빼 문서를 줄인다
  it("지도 항목은 지도 화면이 쓰는 칸만 남기고 좌표를 소수 여섯째 자리로 줄인다", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(envelope({ markers: [{ ...item("a"), lat: 37.2953404384071, lng: 127.081191231128, supplyType: "분양주택", competition: "3.2:1", moveIn: "2028-07" }], totalCount: 1 }))));
    const { items: [mapped] } = await getSubscriptionMapItems();
    expect(mapped.coord).toEqual({ lat: 37.29534, lng: 127.081191 });
    expect(Object.keys(mapped).sort()).toEqual(["agency", "coord", "dday", "deadline", "households", "id", "image", "location", "sizes", "status", "title"]);
  });
});

describe("상세(API-011)", () => {
  it.each([[404, "NOT_FOUND"], [422, "VALIDATION_ERROR"]])("없는 공고·형식이 틀린 id(%s)는 null이다", async (status, message) => {
    fetchMock.mockResolvedValue(failure(status, message));
    await expect(getSubscriptionDetail("a".repeat(101))).resolves.toBeNull();
  });

  it("서버 오류는 '없음'으로 숨기지 않고 그대로 던진다", async () => {
    fetchMock.mockResolvedValue(failure(500, "INTERNAL_ERROR"));
    await expect(getSubscriptionDetail("cell-1")).rejects.toMatchObject({ status: 500 });
  });

  it("id는 경로 조각으로 인코딩한다", async () => {
    fetchMock.mockResolvedValue(failure(404, "NOT_FOUND"));
    await getSubscriptionDetail("a/b?c");
    expect(fetchMock.mock.calls[0][0]).toContain("/api/subscriptions/a%2Fb%3Fc");
  });
});

describe("통합 검색(API-095)", () => {
  it("공고 몫의 항목과 전체 건수를 준다", async () => {
    answer({ page: 1, pageSize: 8, subscriptions: { items: [item("a")], totalCount: 31 }, products: { items: [], totalCount: 0 } });
    const result = await searchSubscriptions("  강남  개포 ", { pageSize: 8 });
    expect(Object.fromEntries(requested().searchParams)).toEqual({ q: "강남 개포", page: "1", pageSize: "8" });
    expect(result).toMatchObject({ page: 1, pageSize: 8, totalCount: 31 });
  });

  it("빈 검색어는 묻지 않는다 — API는 빈 검색어를 요청 오류로 막는다", async () => {
    await expect(searchSubscriptions("   ")).resolves.toMatchObject({ items: [], totalCount: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
