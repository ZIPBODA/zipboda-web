import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSearchSuggestions } from "./fetchSearchSuggestions";

const respond = (status: number, body: unknown) => vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("fetchSearchSuggestions", () => {
  it("web 추천 경로에 검색어를 실어 묻고, 끊을 신호를 넘긴다", async () => {
    const fetchMock = respond(200, { entries: [{ id: "a", kind: "housing", name: "노원 행복주택", href: "/subscriptions/a", description: "", context: "", fields: [] }], totalCount: 3 });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await expect(fetchSearchSuggestions("노원 행복", controller.signal)).resolves.toMatchObject({ totalCount: 3 });
    expect(fetchMock.mock.calls[0][0]).toBe(`/search/suggestions?${new URLSearchParams({ q: "노원 행복" })}`);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it("실패 응답과 모양이 다른 응답은 오류다", async () => {
    vi.stubGlobal("fetch", respond(500, {}));
    await expect(fetchSearchSuggestions("a", new AbortController().signal)).rejects.toThrow("500");
    vi.stubGlobal("fetch", respond(200, { entries: [{ id: 1 }], totalCount: 1 }));
    await expect(fetchSearchSuggestions("a", new AbortController().signal)).rejects.toThrow("모양");
  });
});
