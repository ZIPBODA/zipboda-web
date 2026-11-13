import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { Subscription, SubscriptionPage } from "./types";
import { useSubscriptionPages } from "./useSubscriptionPages";

const item = (id: string): Subscription => ({
  id, title: id, agency: "LH", region: "서울", location: "서울", sizes: [], applicants: null, households: null,
  competition: null, moveIn: null, deadline: null, dday: null, image: null
});
const pageOf = (page: number, ids: string[], totalCount: number): SubscriptionPage => ({ items: ids.map(item), page, pageSize: 2, totalCount });

describe("useSubscriptionPages", () => {
  it("다음 페이지를 이어 붙이고, 마지막 페이지에서 더 보기를 멈춘다", async () => {
    const loadPage = vi.fn(async (page: number) => pageOf(page, page === 2 ? ["c", "d"] : ["e"], 5));
    const { result } = renderHook(() => useSubscriptionPages(pageOf(1, ["a", "b"], 5), loadPage));
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());
    expect(loadPage).toHaveBeenLastCalledWith(2);
    expect(result.current.items.map((entry) => entry.id)).toEqual(["a", "b", "c", "d"]);
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());
    expect(loadPage).toHaveBeenLastCalledWith(3);
    expect(result.current.items.map((entry) => entry.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect(result.current.hasMore).toBe(false);
  });

  // 두 번 받는 사이에 공고가 새로 들어오면 경계가 밀려 같은 공고가 다시 온다
  it("이미 받은 공고는 다시 붙이지 않고, 바뀐 전체 건수를 따른다", async () => {
    const { result } = renderHook(() => useSubscriptionPages(pageOf(1, ["a", "b"], 4), async () => pageOf(2, ["b", "c"], 6)));
    await act(() => result.current.loadMore());
    expect(result.current.items.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    expect(result.current.totalCount).toBe(6);
    expect(result.current.hasMore).toBe(true);
  });

  it("실패하면 알리고, 다시 누르면 같은 페이지를 다시 받는다", async () => {
    const loadPage = vi.fn().mockRejectedValueOnce(new Error("API down")).mockResolvedValue(pageOf(2, ["c"], 3));
    const { result } = renderHook(() => useSubscriptionPages(pageOf(1, ["a", "b"], 3), loadPage));
    await act(() => result.current.loadMore());
    expect(result.current.failed).toBe(true);
    expect(result.current.items).toHaveLength(2);
    await act(() => result.current.loadMore());
    expect(loadPage.mock.calls.map(([page]) => page)).toEqual([2, 2]);
    expect(result.current.failed).toBe(false);
    expect(result.current.items).toHaveLength(3);
  });
});
