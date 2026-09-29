import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

afterEach(() => vi.unstubAllGlobals());

describe("useMediaQuery", () => {
  it("matchMedia가 없는 환경에서는 false다", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(renderHook(() => useMediaQuery("(max-width: 767.98px)")).result.current).toBe(false);
  });

  it("조건이 바뀌면 따라 바뀌고, 사라질 때 구독을 끊는다", () => {
    let listener = () => {};
    const media = { matches: true, addEventListener: vi.fn((_: string, next: () => void) => { listener = next; }), removeEventListener: vi.fn() };
    vi.stubGlobal("matchMedia", vi.fn(() => media));
    const { result, unmount } = renderHook(() => useMediaQuery("(max-width: 767.98px)"));
    expect(result.current).toBe(true);
    media.matches = false;
    act(() => listener());
    expect(result.current).toBe(false);
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", listener);
  });
});
