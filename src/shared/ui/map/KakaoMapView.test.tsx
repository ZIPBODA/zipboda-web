import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { loadKakaoMaps } from "../../lib/kakaoMapLoader";
import { createMarkerLayer } from "./createMarkerLayer";
import { MAP_FOCUS_ANIMATION_MS, MAP_FOCUS_LEVEL } from "../../config/map";
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
  const origin = { lat: 37.5, lng: 127, getLat: (): number => 37.5, getLng: (): number => 127 };
  const map = {
    jump: vi.fn(),
    setCenter: vi.fn(), panBy: vi.fn(), getCenter: vi.fn(() => origin),
    getProjection: () => ({ containerPointFromCoords: () => ({ x: 0, y: 0 }), coordsFromContainerPoint: (p: { x: number; y: number }) => ({ getLat: () => 37.5 - p.y / 10000, getLng: () => 127 + p.x / 10000 }) }),
    setBounds: vi.fn(), getBounds: () => ({ contain }), relayout: vi.fn(),
    getLevel: () => level,
    setLevel: vi.fn((next: number) => { level = next; idle?.(); })
  };
  const constructor = vi.fn(function () { return map; });
  const maps = {
    Marker: class { setMap = vi.fn(); },
    Point: class { constructor(public x: number, public y: number) {} },
    CustomOverlay: class { setMap = vi.fn(); },
    Map: constructor, MarkerClusterer: vi.fn(),
    LatLng: class { constructor(public lat: number, public lng: number) {} },
    LatLngBounds: class {},
    event: {
      addListener: vi.fn((_map: unknown, _name: string, handler: () => void) => { idle = handler; }),
      removeListener: vi.fn()
    }
  };
  const layer = { sync: vi.fn(), select: vi.fn(), selectGroup: vi.fn(), dispose: vi.fn(), redraw: vi.fn() };
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
  it("상세 선택은 가려진 영역을 비켜 핀이 보이는 자리로 한 번에 날아가고, 같은 요청은 반복하지 않는다", async () => {
    const sdk = setupSdk();
    const focusRequest = { point: markers[0].point, padding: [100, 0, 400, 0] as const };
    const { rerender } = render(<KakaoMapView markers={markers} clustering focusRequest={focusRequest} />);
    await waitFor(() => expect(sdk.map.jump).toHaveBeenCalledTimes(1));
    const [center, level, options] = sdk.map.jump.mock.calls[0] as [{ getLat: () => number; getLng: () => number }, number, unknown];
    expect(level).toBe(MAP_FOCUS_LEVEL);
    // 아래 400px이 가려지면 핀은 남은 위쪽 공간 가운데, 즉 중심에서 150px 위에 놓여야 한다.
    // 그 150px은 도착 배율(4) 기준이라 지금 배율(8)에서는 2^(8-4)=16분의 1만 옮긴다.
    expect(center.getLat()).toBeCloseTo(37.5 - 150 / 16 / 10000, 8);
    expect(center.getLng()).toBeCloseTo(127, 8);
    expect(options).toEqual({ animate: { duration: MAP_FOCUS_ANIMATION_MS } });
    // 프레임마다 중심을 옮기거나 단계별로 확대하지 않는다
    expect(sdk.map.setCenter).not.toHaveBeenCalled();
    expect(sdk.map.setLevel).not.toHaveBeenCalled();
    rerender(<KakaoMapView markers={[...markers]} clustering focusRequest={focusRequest} />);
    expect(sdk.map.jump).toHaveBeenCalledTimes(1);
  });

  it("이미 더 가까이 보고 있으면 물러나지 않고 자리만 옮긴다", async () => {
    const sdk = setupSdk();
    const { rerender } = render(<KakaoMapView markers={markers} clustering />);
    await screen.findByRole("button", { name: "지도 확대" });
    // 처음 전체 맞춤이 끝난 뒤 사용자가 직접 깊이 들어간 상태
    sdk.map.setLevel(2);
    rerender(<KakaoMapView markers={markers} clustering focusRequest={{ point: markers[0].point, padding: [0, 0, 0, 0] }} />);
    await waitFor(() => expect(sdk.map.jump).toHaveBeenCalledTimes(1));
    expect(sdk.map.jump.mock.calls[0][1]).toBe(2);
  });

  it("움직임을 줄이도록 설정한 사용자에게는 애니메이션 없이 바로 옮긴다", async () => {
    const sdk = setupSdk();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    render(<KakaoMapView markers={markers} clustering focusRequest={{ point: markers[0].point, padding: [0, 0, 0, 0] }} />);
    await waitFor(() => expect(sdk.map.jump).toHaveBeenCalledTimes(1));
    expect(sdk.map.jump.mock.calls[0][2]).toEqual({ animate: false });
  });

  it("작업 영역의 필터·검색·빈 결과는 최초 fit 후 위치를 보존한다", async () => {
    const sdk = setupSdk();
    const initialCenter = { lat: 37.5, lng: 127 };
    const { rerender } = render(<KakaoMapView markers={markers} clustering initialCenter={initialCenter} />);
    await screen.findByRole("button", { name: "지도 확대" });
    await waitFor(() => expect(sdk.map.setBounds).toHaveBeenCalledTimes(1));
    sdk.map.setBounds.mockClear(); sdk.map.setCenter.mockClear(); sdk.map.setLevel.mockClear();
    rerender(<KakaoMapView markers={[]} clustering initialCenter={initialCenter} />);
    rerender(<KakaoMapView markers={[markers[0]]} clustering initialCenter={initialCenter} />);
    expect(sdk.constructor).toHaveBeenCalledTimes(1);
    expect(sdk.map.setCenter).not.toHaveBeenCalled();
    expect(sdk.map.setBounds).not.toHaveBeenCalled();
    expect(sdk.map.setLevel).not.toHaveBeenCalled();
  });

  it("단일 결과도 초기에는 배지 단계이며 수동 확대만 핀 단계로 진입한다", async () => {
    const sdk = setupSdk();
    render(<KakaoMapView markers={[markers[0]]} clustering level={8} />);
    await screen.findByRole("button", { name: "지도 확대" });
    await waitFor(() => expect(sdk.map.setLevel).toHaveBeenCalledWith(8));
    for (let step = 0; step < 4; step++) fireEvent.click(screen.getByRole("button", { name: "지도 확대" }));
    expect(sdk.map.getLevel()).toBe(4);
    expect(sdk.map.setBounds).not.toHaveBeenCalled();
  });
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
    sdk.map.setBounds.mockClear();
    rerender(<KakaoMapView markers={[markers[1]]} clustering />);
    expect(sdk.constructor).toHaveBeenCalledTimes(1);
    expect(sdk.layer.sync).toHaveBeenLastCalledWith([markers[1]], null);
    // 필터를 눌렀다고 보던 동네를 떠나지 않는다 — 마커만 갈아 낀다
    expect(sdk.map.setBounds).not.toHaveBeenCalled();
    expect(sdk.map.setLevel).not.toHaveBeenCalled();
    expect(sdk.map.setCenter).not.toHaveBeenCalled();
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
    sdk.map.setCenter.mockImplementation(() => sdk.idle());
    Object.defineProperty(container, "clientHeight", { value: 560, configurable: true });
    sdk.map.getCenter.mockReturnValue({ lat: 37.4, lng: 127.1, getLat: () => 37.4, getLng: () => 127.1 });
    sdk.idle();
    sdk.resize();
    expect(sdk.map.setCenter).toHaveBeenLastCalledWith(previousCenter);
    Object.defineProperty(container, "clientWidth", { value: 480, configurable: true });
    sdk.resize();
    expect(sdk.map.setCenter).toHaveBeenLastCalledWith(previousCenter);
    expect(sdk.map.setBounds).not.toHaveBeenCalled();
    expect(sdk.map.setLevel).not.toHaveBeenCalled();
  });

  it("상세 지도는 확대 버튼과 클러스터를 사용하지 않는다", async () => {
    const sdk = setupSdk();
    render(<KakaoMapView markers={markers} interactive={false} />);
    await waitFor(() => expect(createMarkerLayer).toHaveBeenCalled());
    expect(createMarkerLayer).toHaveBeenLastCalledWith(sdk.maps, sdk.map, false, expect.any(Function), expect.any(Function));
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
