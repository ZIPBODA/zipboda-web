import { describe, expect, it, vi } from "vitest";
import { MAP_CLUSTER_OPTIONS } from "../../config/map";
import { createMarkerLayer } from "./createMarkerLayer";
import type { MapMarker } from "./types";

function setup(clustering = true) {
  const listeners = new Map<object, Map<string, (...args: never[]) => void>>();
  const addListener = vi.fn((target: object, type: string, handler: (...args: never[]) => void) => {
    if (!listeners.has(target)) listeners.set(target, new Map());
    listeners.get(target)!.set(type, handler);
  });
  const removeListener = vi.fn((target: object, type: string) => { listeners.get(target)?.delete(type); });
  const created: Marker[] = [];
  class Marker {
    setMap = vi.fn(); setPosition = vi.fn(); setZIndex = vi.fn(); setTitle = vi.fn();
    constructor() { created.push(this); }
  }
  const clusterer = { addMarkers: vi.fn(), removeMarkers: vi.fn(), clear: vi.fn(), redraw: vi.fn() };
  const Clusterer = vi.fn(function () { return clusterer; });
  const map = { getLevel: vi.fn(() => 8), setLevel: vi.fn() };
  const maps = {
    LatLng: class { constructor(public lat: number, public lng: number) {} },
    Marker, MarkerClusterer: Clusterer, event: { addListener, removeListener }
  };
  const onSelect = vi.fn();
  const layer = createMarkerLayer(maps as unknown as typeof kakao.maps, map as unknown as kakao.maps.Map, clustering, onSelect);
  const emit = (target: object, type: string, ...args: unknown[]) => {
    const callback = listeners.get(target)?.get(type);
    if (callback) (callback as (...values: unknown[]) => void)(...args);
  };
  return { layer, map, created, clusterer, Clusterer, emit, onSelect, removeListener };
}

const items: MapMarker[] = [
  { id: "one", label: "주택 하나", point: { lat: 37.5, lng: 127 } },
  { id: "two", label: "주택 둘", point: { lat: 37.501, lng: 127.001 } }
];

describe("지도 마커 묶음", () => {
  it("화면 거리·확대 단계에 따라 SDK가 개수를 계산하도록 설정한다", () => {
    const { layer, Clusterer, clusterer, created } = setup();
    layer.sync(items, "one");
    expect(Clusterer).toHaveBeenCalledWith(expect.objectContaining({ ...MAP_CLUSTER_OPTIONS, averageCenter: true, disableClickZoom: true }));
    const options = Clusterer.mock.calls[0] as unknown as [{ texts: (size: number) => string }];
    expect(options[0].texts(12)).toBe("12건");
    expect(clusterer.addMarkers).toHaveBeenCalledWith(created, true);
    expect(created.every((marker) => marker.setMap.mock.calls.length === 0)).toBe(true);
  });

  it("필터에서 사라진 마커를 묶음에서 제거하고 남은 마커는 재사용한다", () => {
    const { layer, created, clusterer, emit, onSelect } = setup();
    layer.sync(items, null);
    const removed = created[1];
    layer.sync([{ ...items[0], point: { lat: 37.6, lng: 127.1 } }], "one");
    expect(created).toHaveLength(2);
    expect(clusterer.removeMarkers).toHaveBeenCalledWith([removed], true);
    expect(removed.setMap).toHaveBeenCalledWith(null);
    expect(created[0].setPosition).toHaveBeenCalledWith(expect.objectContaining({ lat: 37.6, lng: 127.1 }));
    emit(removed, "click");
    expect(onSelect).not.toHaveBeenCalled();
    emit(created[0], "click");
    expect(onSelect).toHaveBeenCalledWith("one");
  });

  it("선택 변경은 확대 단계나 묶음을 재설정하지 않는다", () => {
    const { layer, map, clusterer, created } = setup();
    layer.sync(items, "one");
    clusterer.redraw.mockClear();
    layer.select("two");
    expect(created[1].setZIndex).toHaveBeenLastCalledWith(1);
    expect(created[0].setZIndex).toHaveBeenLastCalledWith(0);
    expect(clusterer.redraw).not.toHaveBeenCalled();
    expect(map.setLevel).not.toHaveBeenCalled();
  });

  it("묶음에 숨겨진 핀의 라벨이 바뀌어도 SDK DOM에 직접 접근하지 않는다", () => {
    const { layer, created, clusterer } = setup();
    layer.sync(items, null);
    created[0].setTitle.mockImplementation(() => { throw new Error("detached marker"); });
    layer.sync([{ ...items[0], label: "수정된 이름" }, items[1]], null);
    expect(created).toHaveLength(3);
    expect(clusterer.removeMarkers).toHaveBeenLastCalledWith([created[0]], true);
    expect(clusterer.addMarkers).toHaveBeenLastCalledWith([created[2]], true);
    expect(created[0].setTitle).not.toHaveBeenCalled();
  });

  it("묶음 클릭과 키보드 Enter·Space는 해당 중심에서 한 단계 확대한다", () => {
    const { layer, clusterer, map, emit } = setup();
    const node = document.createElement("div");
    const center = { lat: 37.5, lng: 127 };
    const cluster = { getSize: () => 2, getCenter: () => center, getClusterMarker: () => ({ getContent: () => node }) };
    emit(clusterer, "clusterclick", cluster);
    expect(map.setLevel).toHaveBeenLastCalledWith(7, { anchor: center });
    emit(clusterer, "clustered", [cluster]);
    expect(node).toHaveAttribute("role", "button");
    expect(node).toHaveAttribute("aria-label", "주택 2건 모아보기, 지도 확대");
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    node.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(map.setLevel).toHaveBeenCalledTimes(3);
    emit(clusterer, "clustered", [cluster]);
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(map.setLevel).toHaveBeenCalledTimes(4);
    layer.dispose();
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(map.setLevel).toHaveBeenCalledTimes(4);
  });

  it("확대된 개별 핀에는 묶음 버튼을 붙이지 않는다", () => {
    const { clusterer, map, emit } = setup();
    map.getLevel.mockReturnValue(4);
    const getClusterMarker = vi.fn();
    emit(clusterer, "clustered", [{ getSize: () => 2, getClusterMarker }]);
    expect(getClusterMarker).not.toHaveBeenCalled();
  });

  it("정리할 때 지도 핀과 이벤트를 모두 해제한다", () => {
    const { layer, created, clusterer, emit, onSelect } = setup();
    layer.sync(items, null);
    layer.dispose();
    expect(clusterer.clear).toHaveBeenCalledTimes(1);
    created.forEach((marker) => {
      expect(marker.setMap).toHaveBeenLastCalledWith(null);
      emit(marker, "click");
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("상세 지도에서는 묶음 없이 기존 핀을 표시한다", () => {
    const { layer, map, created, Clusterer } = setup(false);
    layer.sync(items.slice(0, 1), null);
    expect(Clusterer).not.toHaveBeenCalled();
    expect(created[0].setMap).toHaveBeenCalledWith(map);
  });
});
