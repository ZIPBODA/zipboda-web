import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApi } from "./client";

const respond = (status: number, body: unknown) =>
  vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  vi.stubEnv("ZIPBODA_API_URL", "http://api.test/api/");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getApi", () => {
  it("주소 끝의 /를 정리하고 값이 없는 조건은 보내지 않으며, 성공 엔벌로프의 data를 준다", async () => {
    const fetchMock = respond(200, { success: true, data: { ok: 1 }, error: null });
    vi.stubGlobal("fetch", fetchMock);
    await expect(getApi("/subscriptions", { region: 1, keyword: "강남 개포", status: undefined })).resolves.toEqual({ ok: 1 });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("http://api.test/api/subscriptions");
    expect([...url.searchParams]).toEqual([["region", "1"], ["keyword", "강남 개포"]]);
  });

  it("실패 엔벌로프는 상태·코드·메시지를 담은 ApiError다", async () => {
    vi.stubGlobal("fetch", respond(404, { success: false, data: null, error: { code: "E004", message: "NOT_FOUND" } }));
    const error = await getApi("/subscriptions/x").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "E004", message: "NOT_FOUND" });
  });

  it("엔벌로프가 아닌 응답(프록시 오류 페이지 등)도 ApiError로 끝낸다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>Bad Gateway</html>", { status: 502 })));
    await expect(getApi("/subscriptions")).rejects.toMatchObject({ name: "ApiError", status: 502, code: null });
  });

  // 주소가 비면 목 데이터로 돌아가지 않고 실패해야 배포 설정 누락이 드러난다(frontend-rule A1)
  it("API 주소가 없으면 요청하지 않고 실패한다", async () => {
    vi.stubEnv("ZIPBODA_API_URL", "");
    const fetchMock = respond(200, {});
    vi.stubGlobal("fetch", fetchMock);
    await expect(getApi("/subscriptions")).rejects.toThrow("ZIPBODA_API_URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
