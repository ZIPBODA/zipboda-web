import { describe, expect, it, vi } from "vitest";
import { MAP_CLUSTER_OPTIONS, MAP_DETAIL_PIN_LEVEL, MAP_SINGLE_PIN_LEVEL } from "../../config/map";
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
  let minClusterSize: number = MAP_CLUSTER_OPTIONS.minClusterSize;
  const clusterer = {
    addMarkers: vi.fn(), removeMarkers: vi.fn(), clear: vi.fn(), redraw: vi.fn(),
    getMinClusterSize: vi.fn(() => minClusterSize),
    setMinClusterSize: vi.fn((size: number) => { minClusterSize = size; })
  };
  const Clusterer = vi.fn(function () { return clusterer; });
  const map = { getLevel: vi.fn(() => MAP_SINGLE_PIN_LEVEL + 2), setLevel: vi.fn() };
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

  it("최대 확대의 개별 핀에는 묶음 버튼을 붙이지 않는다", () => {
    const { clusterer, map, emit } = setup();
    map.getLevel.mockReturnValue(MAP_DETAIL_PIN_LEVEL);
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

  it("멀리서는 한 건짜리도 숫자 배지로 만든다", () => {
    const { layer, Clusterer, created, clusterer } = setup();
    layer.sync(items.slice(0, 1), null);
    const options = Clusterer.mock.calls[0] as unknown as [{ minClusterSize: number; texts: (size: number) => string }];
    expect(options[0].minClusterSize).toBe(1);
    expect(options[0].texts(1)).toBe("1건");
    expect(options[0].texts(3)).toBe("3건");
    // 핀을 지도에 직접 올리지 않으므로 묶음 밖에 남는 핀이 없다
    expect(created[0].setMap).not.toHaveBeenCalled();
    expect(clusterer.addMarkers).toHaveBeenCalledWith(created, true);
  });

  it("한 건짜리 배지도 키보드로 확대할 수 있다", () => {
    const { clusterer, map, emit } = setup();
    const node = document.createElement("div");
    const center = { lat: 37.5, lng: 127 };
    emit(clusterer, "clustered", [{ getSize: () => 1, getCenter: () => center, getClusterMarker: () => ({ getContent: () => node }) }]);
    expect(node).toHaveAttribute("aria-label", "주택 1건 모아보기, 지도 확대");
    expect(node.tabIndex).toBe(0);
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(map.setLevel).toHaveBeenLastCalledWith(7, { anchor: center });
  });

  it("배지만 있는 단계에서는 핀 클릭이 공고를 고르지 않는다", () => {
    const { layer, map, created, emit, onSelect } = setup();
    layer.sync(items, null);
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL + 1);
    emit(created[0], "click");
    expect(onSelect).not.toHaveBeenCalled();
    // 한 건짜리가 핀으로 풀리는 단계부터는 고를 수 있어야 한다
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL);
    emit(created[0], "click");
    expect(onSelect).toHaveBeenCalledWith("one");
  });

  it("확대하면 한 건짜리는 최대 배율까지 가지 않아도 핀으로 풀린다", () => {
    const { layer, map, clusterer, emit } = setup();
    layer.sync(items, null);
    expect(clusterer.getMinClusterSize()).toBe(1);

    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL);
    emit(map, "zoom_changed");
    // 2가 되면 SDK가 한 건짜리를 묶지 않고 핀으로 남긴다. 두 건 이상은 그대로 배지다
    expect(clusterer.setMinClusterSize).toHaveBeenLastCalledWith(2);

    clusterer.setMinClusterSize.mockClear();
    emit(map, "zoom_changed");
    expect(clusterer.setMinClusterSize).not.toHaveBeenCalled();

    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL + 1);
    emit(map, "zoom_changed");
    expect(clusterer.setMinClusterSize).toHaveBeenLastCalledWith(1);
  });

  it("상세 지도는 확대 단계와 무관하게 핀을 고를 수 있다", () => {
    const { layer, map, created, emit, onSelect } = setup(false);
    layer.sync(items.slice(0, 1), null);
    map.getLevel.mockReturnValue(8);
    emit(created[0], "click");
    expect(onSelect).toHaveBeenCalledWith("one");
  });
});
