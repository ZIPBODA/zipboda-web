import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { loadKakaoMaps } from "../../lib/kakaoMapLoader";
import { createMarkerLayer } from "./createMarkerLayer";
import { KakaoMapView } from "./KakaoMapView";
import type { MapMarker } from "./types";

vi.mock("../../lib/kakaoMapLoader", () => ({ loadKakaoMaps: vi.fn() }));
vi.mock("./createMarkerLayer", () => ({ createMarkerLayer: vi.fn() }));

const markers: MapMarker[] = [
  { id: "one", point: { lat: 37.5, lng: 127 } },
  { id: "two", point: { lat: 37.6, lng: 127.1 } }
];

function setupSdk() {
  let level = 8;
  let idle: (() => void) | undefined;
  let resize: ResizeObserverCallback | undefined;
  const contain = vi.fn(() => true);
  const map = {
    setCenter: vi.fn(), getCenter: vi.fn(() => ({ lat: 37.5, lng: 127 })),
    setBounds: vi.fn(), getBounds: () => ({ contain }), relayout: vi.fn(),
    getLevel: () => level,
    setLevel: vi.fn((next: number) => { level = next; idle?.(); })
  };
  const constructor = vi.fn(function () { return map; });
  const maps = {
    Map: constructor, MarkerClusterer: vi.fn(),
    LatLng: class { constructor(public lat: number, public lng: number) {} },
    LatLngBounds: class {},
    event: {
      addListener: vi.fn((_map: unknown, _name: string, handler: () => void) => { idle = handler; }),
      removeListener: vi.fn()
    }
  };
  const layer = { sync: vi.fn(), select: vi.fn(), dispose: vi.fn(), redraw: vi.fn() };
  vi.mocked(createMarkerLayer).mockReturnValue(layer);
  vi.stubGlobal("kakao", { maps });
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {} disconnect() {}
  });
  vi.mocked(loadKakaoMaps).mockResolvedValue({ status: "ready", maps: maps as unknown as typeof kakao.maps });
  return { map, maps, constructor, layer, contain, idle: () => act(() => idle?.()), resize: () => act(() => resize?.([], {} as ResizeObserver)) };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("지도 상태 갱신", () => {
  it("확대·축소 버튼으로 지도 배율을 바꾸고 보이는 주택 수를 갱신한다", async () => {
    const sdk = setupSdk();
    const visible = vi.fn();
    render(<KakaoMapView markers={markers} clustering onVisibleMarkersChange={visible} />);
    fireEvent.click(await screen.findByRole("button", { name: "지도 확대" }));
    expect(sdk.map.setLevel).toHaveBeenLastCalledWith(7);
    fireEvent.click(screen.getByRole("button", { name: "지도 축소" }));
    expect(sdk.map.setLevel).toHaveBeenLastCalledWith(8);
    // 지도 인스턴스는 비동기로 생기고 첫 보고는 그 뒤 effect에서 나간다. 버튼이 보인다고 effect가 끝난 것은 아니다
    await waitFor(() => expect(visible).toHaveBeenLastCalledWith(["one", "two"]));
    sdk.contain.mockImplementation((...args: unknown[]) => (args[0] as { lat: number }).lat < 37.6);
    sdk.idle();
    expect(visible).toHaveBeenLastCalledWith(["one"]);
  });

  it("선택만 바꾸면 지도를 다시 만들거나 전체 위치로 되돌리지 않는다", async () => {
    const sdk = setupSdk();
    const { rerender } = render(<KakaoMapView markers={markers} clustering selectedId="one" />);
    await screen.findByRole("button", { name: "지도 확대" });
    sdk.map.setBounds.mockClear(); sdk.layer.sync.mockClear();
    rerender(<KakaoMapView markers={markers} clustering selectedId="two" />);
    expect(sdk.constructor).toHaveBeenCalledTimes(1);
    expect(sdk.map.setBounds).not.toHaveBeenCalled();
    expect(sdk.layer.sync).not.toHaveBeenCalled();
    expect(sdk.layer.select).toHaveBeenLastCalledWith("two");
  });

  it("필터가 바뀌면 같은 지도에서 마커를 갱신하고 해제 시 이벤트를 정리한다", async () => {
    const sdk = setupSdk();
    const { rerender, unmount } = render(<KakaoMapView markers={markers} clustering />);
    await screen.findByRole("button", { name: "지도 확대" });
    rerender(<KakaoMapView markers={[markers[1]]} clustering />);
    expect(sdk.constructor).toHaveBeenCalledTimes(1);
    expect(sdk.layer.sync).toHaveBeenLastCalledWith([markers[1]], null);
    expect(sdk.map.setLevel).toHaveBeenLastCalledWith(4);
    unmount();
    expect(sdk.layer.dispose).toHaveBeenCalledTimes(1);
    expect(sdk.maps.event.removeListener).toHaveBeenCalledWith(sdk.map, "idle", expect.any(Function));
  });

  it("창 크기를 변경해도 사용자의 확대 단계와 중심을 유지한다", async () => {
    const sdk = setupSdk();
    render(<KakaoMapView markers={markers} clustering ariaLabel="테스트 지도" />);
    await screen.findByRole("button", { name: "지도 확대" });
    const container = screen.getByRole("group", { name: "테스트 지도" }).firstElementChild!;
    Object.defineProperty(container, "clientWidth", { value: 360, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 420, configurable: true });
    sdk.resize();
    sdk.map.setBounds.mockClear(); sdk.map.setLevel.mockClear();
    const previousCenter = sdk.map.getCenter();
    Object.defineProperty(container, "clientHeight", { value: 560, configurable: true });
    sdk.map.getCenter.mockReturnValue({ lat: 37.4, lng: 127.1 });
    sdk.idle();
    sdk.resize();
    expect(sdk.map.setCenter).toHaveBeenLastCalledWith(previousCenter);
    expect(sdk.map.setBounds).not.toHaveBeenCalled();
    expect(sdk.map.setLevel).not.toHaveBeenCalled();
  });

  it("상세 지도는 확대 버튼과 클러스터를 사용하지 않는다", async () => {
    const sdk = setupSdk();
    render(<KakaoMapView markers={markers} interactive={false} />);
    await waitFor(() => expect(createMarkerLayer).toHaveBeenCalled());
    expect(createMarkerLayer).toHaveBeenLastCalledWith(sdk.maps, sdk.map, false, expect.any(Function));
    expect(screen.queryByRole("button", { name: "지도 확대" })).toBeNull();
  });

  it.each(["failed", "disabled"] as const)("SDK %s 시 기존 대체 표시를 유지한다", async (status) => {
    setupSdk();
    vi.mocked(loadKakaoMaps).mockResolvedValue({ status, maps: null });
    render(<KakaoMapView markers={markers} clustering fallback={<p>지도 대체 표시</p>} />);
    expect(await screen.findByText("지도 대체 표시")).toBeInTheDocument();
    expect(createMarkerLayer).not.toHaveBeenCalled();
  });
});
