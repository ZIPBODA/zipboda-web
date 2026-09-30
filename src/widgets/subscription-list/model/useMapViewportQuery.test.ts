import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMapViewportQuery } from "./useMapViewportQuery";

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => navigation.params }));

const at = (href: string) => window.history.replaceState(null, "", href);
// 뒤로가기로 이전 기록에 도착한 것처럼 주소를 바꾸고 popstate를 보낸다
const backTo = (href: string) => act(() => { at(href); window.dispatchEvent(new PopStateEvent("popstate")); });

describe("지도 자리 주소", () => {
  beforeEach(() => {
    navigation.params = new URLSearchParams();
    at("/subscriptions?lat=37.50000&lng=127.00000&zoom=10");
  });
  afterEach(() => at("/"));

  it("같은 지도 페이지 안에서 뒤로가면, 되돌아간 기록의 주소를 지금 지도 자리로 고치고 그 기록의 필터는 지킨다", () => {
    const { result } = renderHook(() => useMapViewportQuery());
    act(() => result.current.saveViewport({ center: { lat: 37.66713, lng: 127.03371 }, level: 4 }));
    expect(window.location.search).toBe("?lat=37.66713&lng=127.03371&zoom=4");
    backTo("/subscriptions?region=서울&lat=37.50000&lng=127.00000&zoom=10");
    const search = new URLSearchParams(window.location.search);
    expect(search.get("region")).toBe("서울");
    expect([search.get("lat"), search.get("lng"), search.get("zoom")]).toEqual(["37.66713", "127.03371", "4"]);
  });

  it("다른 페이지로 돌아간 경우와 지도가 아직 자리를 알리지 않은 경우는 건드리지 않는다", () => {
    const { result } = renderHook(() => useMapViewportQuery());
    const replace = vi.spyOn(window.history, "replaceState");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(replace).not.toHaveBeenCalled();
    replace.mockRestore();
    act(() => result.current.saveViewport({ center: { lat: 37.6, lng: 127.1 }, level: 5 }));
    backTo("/subscriptions/dobong-banghak");
    expect(window.location.pathname).toBe("/subscriptions/dobong-banghak");
    expect(window.location.search).toBe("");
  });

  it("되살린 뒤 움직이지 않았다면 뒤로가기 뒤에도 반올림된 값이 아니라 되살린 자리를 적는다 — 새로고침마다 밀리지 않게", () => {
    navigation.params = new URLSearchParams("lat=37.6&lng=127.1&zoom=5");
    at("/subscriptions?lat=37.6&lng=127.1&zoom=5");
    const { result } = renderHook(() => useMapViewportQuery());
    // SDK가 픽셀에 맞춰 반올림해 돌려준 자리
    act(() => result.current.saveViewport({ center: { lat: 37.60002, lng: 127.1 }, level: 5 }));
    expect(window.location.search).toBe("?lat=37.6&lng=127.1&zoom=5");
    backTo("/subscriptions?lat=37.50000&lng=127.00000&zoom=10");
    expect(window.location.search).toBe("?lat=37.60000&lng=127.10000&zoom=5");
    // 한 번 움직인 뒤에는 움직인 자리를 적는다
    act(() => result.current.saveViewport({ center: { lat: 37.7, lng: 127.2 }, level: 6 }));
    backTo("/subscriptions?lat=37.50000&lng=127.00000&zoom=10");
    expect(window.location.search).toBe("?lat=37.70000&lng=127.20000&zoom=6");
  });

  it("사라지면 뒤로가기를 더 듣지 않는다", () => {
    const { result, unmount } = renderHook(() => useMapViewportQuery());
    act(() => result.current.saveViewport({ center: { lat: 37.6, lng: 127.1 }, level: 5 }));
    unmount();
    backTo("/subscriptions?lat=37.50000&lng=127.00000&zoom=10");
    expect(window.location.search).toBe("?lat=37.50000&lng=127.00000&zoom=10");
  });
});
