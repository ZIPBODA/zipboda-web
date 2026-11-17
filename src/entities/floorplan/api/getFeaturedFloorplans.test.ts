import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFeaturedFloorplans } from "./getFeaturedFloorplans";
import { HOUSING_FLOORPLANS } from "./housingFloorplans";

const candidates = HOUSING_FLOORPLANS.filter((plan, index, all) =>
  plan.has3d && all.findIndex((other) => other.has3d && other.complexId === plan.complexId) === index);

const detailOf = (id: string, subscriptionId: string | null) => ({
  success: true,
  data: { id, complexName: `단지 ${id}`, subscriptionId },
  error: null
});

let fetchMock: ReturnType<typeof vi.fn<(url: string) => Promise<Response>>>;

beforeEach(() => {
  vi.stubEnv("ZIPBODA_API_URL", "http://api.test/api");
  fetchMock = vi.fn<(url: string) => Promise<Response>>();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("홈 대표 평면도", () => {
  it("3D 검수를 마친 도면을 단지마다 하나씩, API가 고른 공고로 연결한다", async () => {
    fetchMock.mockImplementation(async (url) => {
      const id = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
      return new Response(JSON.stringify(detailOf(id, `cell-${id}`)));
    });
    const items = await getFeaturedFloorplans();
    expect(items).toHaveLength(3);
    for (const item of items) {
      const plan = HOUSING_FLOORPLANS.find((entry) => entry.id === item.id);
      expect(plan?.has3d).toBe(true);
      expect(item).toMatchObject({ title: `단지 ${item.id}`, image: plan?.image2dUrl });
      const url = new URL(item.href ?? "", "https://zipboda.test");
      expect(url.pathname).toBe(`/subscriptions/cell-${item.id}/floorplan`);
      expect(url.searchParams.get("unit")).toBe(item.id);
    }
    expect(new Set(items.map((item) => HOUSING_FLOORPLANS.find((plan) => plan.id === item.id)?.complexId)).size).toBe(3);
  });

  // 들어갈 공고가 없는 도면을 앞세우면 눌렀을 때 빈 상세로 이어진다
  it("보여 줄 공고가 없거나 API에 없는 도면은 건너뛴다", async () => {
    const [first, second] = candidates;
    fetchMock.mockImplementation(async (url) => {
      const id = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
      if (id === first.id) return new Response(JSON.stringify(detailOf(id, null)));
      if (id === second.id) return new Response(JSON.stringify({ success: false, data: null, error: { code: "E004", message: "NOT_FOUND" } }), { status: 404 });
      return new Response(JSON.stringify(detailOf(id, `cell-${id}`)));
    });
    const ids = (await getFeaturedFloorplans()).map((item) => item.id);
    expect(ids).not.toContain(first.id);
    expect(ids).not.toContain(second.id);
    expect(ids).toEqual(candidates.slice(2, 5).map((plan) => plan.id));
  });

  it("몇 건만 실패하면 그 도면만 빼고 보인다", async () => {
    const [first] = candidates;
    fetchMock.mockImplementation(async (url) => {
      const id = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
      if (id === first.id) return new Response(JSON.stringify({ success: false, data: null, error: { code: "E000", message: "INTERNAL_ERROR" } }), { status: 500 });
      return new Response(JSON.stringify(detailOf(id, `cell-${id}`)));
    });
    expect((await getFeaturedFloorplans()).map((item) => item.id)).toEqual(candidates.slice(1, 4).map((plan) => plan.id));
  });

  it("모두 실패하면 API 오류를 숨기지 않는다", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false, data: null, error: { code: "E000", message: "INTERNAL_ERROR" } }), { status: 500 }));
    await expect(getFeaturedFloorplans()).rejects.toMatchObject({ status: 500 });
  });
});
