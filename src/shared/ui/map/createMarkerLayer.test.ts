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
  const inView = vi.fn(() => true);
  const map = { getLevel: vi.fn(() => MAP_SINGLE_PIN_LEVEL + 2), setLevel: vi.fn(), getBounds: () => ({ contain: inView }) };
  const overlays: CustomOverlay[] = [];
  class CustomOverlay {
    setMap = vi.fn(); setZIndex = vi.fn(); setPosition = vi.fn();
    constructor(public options: { content: HTMLElement }) { overlays.push(this); }
  }
  const maps = {
    LatLng: class { constructor(public lat: number, public lng: number) {} },
    Marker, CustomOverlay, MarkerClusterer: Clusterer, event: { addListener, removeListener }
  };
  const onSelect = vi.fn();
  const onGroupSelect = vi.fn();
  const layer = createMarkerLayer(maps as unknown as typeof kakao.maps, map as unknown as kakao.maps.Map, clustering, onSelect, onGroupSelect);
  const emit = (target: object, type: string, ...args: unknown[]) => {
    const callback = listeners.get(target)?.get(type);
    if (callback) (callback as (...values: unknown[]) => void)(...args);
  };
  // 지도에서 걷히지 않은 이름표만 글자로 돌려준다
  const liveLabels = () => overlays.filter((overlay) => overlay.setMap.mock.calls.at(-1)?.[0] !== null).map((overlay) => overlay.options.content);
  return { layer, map, created, clusterer, Clusterer, emit, onSelect, onGroupSelect, removeListener, inView, liveLabels };
}

const items: MapMarker[] = [
  { id: "one", label: "주택 하나", point: { lat: 37.5, lng: 127 } },
  { id: "two", label: "주택 둘", point: { lat: 37.501, lng: 127.001 } }
];

describe("지도 마커 묶음", () => {
  it.each([1, 3])("%i건도 동일한 목록 선택으로 처리하고 제거된 마커 ID는 전달하지 않는다", (count) => {
    const { layer, created, clusterer, emit, onGroupSelect, map } = setup();
    const entries = Array.from({ length: count }, (_, index) => ({ ...items[0], id: `id-${index}` }));
    layer.sync(entries, null);
    const node = document.createElement("div");
    const cluster = { getSize: () => count, getMarkers: () => created, getClusterMarker: () => ({ getContent: () => node }) };
    emit(clusterer, "clustered", [cluster]);
    expect(node).toHaveAttribute("aria-label", `청약 ${count}건 목록 보기`);
    emit(clusterer, "clusterclick", cluster);
    expect(onGroupSelect).toHaveBeenLastCalledWith(entries.map((item) => item.id));
    expect(map.setLevel).not.toHaveBeenCalled();
    layer.sync([], null);
    onGroupSelect.mockClear();
    emit(clusterer, "clusterclick", cluster);
    expect(onGroupSelect).not.toHaveBeenCalled();
  });

  it("가까운 핀 클릭은 위치를 바꾸지 않고 단일 ID만 전달한다", () => {
    const { layer, created, emit, onSelect, map } = setup();
    map.getLevel.mockReturnValue(4);
    layer.sync(items, null);
    emit(created[0], "click");
    expect(onSelect).toHaveBeenCalledWith("one");
    expect(map.setLevel).not.toHaveBeenCalled();
  });
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

  it("묶음 클릭과 키보드 Enter·Space는 확대 없이 내부 ID를 선택한다", () => {
    const { layer, clusterer, map, emit, created, onGroupSelect } = setup();
    layer.sync(items, null);
    const node = document.createElement("div");
    const center = { lat: 37.5, lng: 127 };
    const cluster = { getMarkers: () => created, getSize: () => 2, getCenter: () => center, getClusterMarker: () => ({ getContent: () => node }) };
    emit(clusterer, "clusterclick", cluster);
    expect(onGroupSelect).toHaveBeenLastCalledWith(["one", "two"]);
    expect(map.setLevel).not.toHaveBeenCalled();
    emit(clusterer, "clustered", [cluster]);
    expect(node).toHaveAttribute("role", "button");
    expect(node).toHaveAttribute("aria-label", "청약 2건 목록 보기");
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    node.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onGroupSelect).toHaveBeenCalledTimes(3);
    emit(clusterer, "clustered", [cluster]);
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onGroupSelect).toHaveBeenCalledTimes(4);
    layer.selectGroup(["one", "two"]);
    expect(node).toHaveAttribute("aria-pressed", "true");
    layer.dispose();
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onGroupSelect).toHaveBeenCalledTimes(4);
    expect(map.setLevel).not.toHaveBeenCalled();
  });

  it("선택한 묶음이 분리되면 목록 선택을 바꾸지 않고 하위 배지의 선택 표시를 해제한다", () => {
    const { layer, clusterer, created, emit, onGroupSelect } = setup();
    layer.sync(items, null);
    const groupNode = document.createElement("div");
    const group = { getMarkers: () => created, getSize: () => 2, getClusterMarker: () => ({ getContent: () => groupNode }) };
    emit(clusterer, "clustered", [group]);
    layer.selectGroup(["two", "one"]);
    expect(groupNode).toHaveAttribute("aria-pressed", "true");

    const nodes = created.map(() => document.createElement("div"));
    const split = created.map((marker, index) => ({
      getMarkers: () => [marker], getSize: () => 1, getClusterMarker: () => ({ getContent: () => nodes[index] })
    }));
    emit(clusterer, "clustered", split);
    nodes.forEach((node) => expect(node).toHaveAttribute("aria-pressed", "false"));
    expect(onGroupSelect).not.toHaveBeenCalled();

    emit(clusterer, "clusterclick", split[0]);
    expect(onGroupSelect).toHaveBeenLastCalledWith(["one"]);
    layer.selectGroup(["one"]);
    expect(nodes[0]).toHaveAttribute("aria-pressed", "true");
    expect(nodes[1]).toHaveAttribute("aria-pressed", "false");
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

  it("한 건짜리 배지도 키보드로 열 수 있다", () => {
    const { layer, clusterer, created, emit, onGroupSelect } = setup();
    layer.sync(items.slice(0, 1), null);
    const node = document.createElement("div");
    emit(clusterer, "clustered", [{ getSize: () => 1, getMarkers: () => [created[0]], getClusterMarker: () => ({ getContent: () => node }) }]);
    expect(node).toHaveAttribute("aria-label", "청약 1건 목록 보기");
    expect(node.tabIndex).toBe(0);
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onGroupSelect).toHaveBeenLastCalledWith(["one"]);
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

  it("핀 단계에서는 배지 밖의 집마다 이름표를 달고, 고른 집만 브랜드 색으로 위에 둔다", () => {
    const { layer, map, clusterer, emit, liveLabels } = setup();
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL);
    layer.sync(items, "one");
    emit(clusterer, "clustered", []);
    const [first, second] = liveLabels();
    expect(liveLabels().map((node) => node.textContent)).toEqual(["주택 하나", "주택 둘"]);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveClass("bg-brand");
    expect(second).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveClass("bg-surface");
    layer.select("two");
    expect(first).toHaveClass("bg-surface");
    expect(second).toHaveClass("bg-brand");
  });

  it("배지에 묶인 집·화면 밖의 집·배지만 있는 단계에는 이름표를 달지 않는다", () => {
    const { layer, map, clusterer, created, emit, inView, liveLabels } = setup();
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL);
    layer.sync(items, null);
    emit(clusterer, "clustered", [{ getSize: () => 2, getMarkers: () => created, getClusterMarker: () => ({ getContent: () => document.createElement("div") }) }]);
    expect(liveLabels()).toEqual([]);

    emit(clusterer, "clustered", []);
    inView.mockImplementation(() => false);
    emit(map, "idle");
    expect(liveLabels()).toEqual([]);

    inView.mockImplementation(() => true);
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL + 1);
    emit(map, "idle");
    expect(liveLabels()).toEqual([]);
  });

  it("묶지 않는 최대 배율에서는 묶음 결과가 남아 있어도 모든 핀에 이름을 단다", () => {
    const { layer, map, clusterer, created, emit, liveLabels } = setup();
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL);
    layer.sync(items, null);
    emit(clusterer, "clustered", [{ getSize: () => 2, getMarkers: () => created, getClusterMarker: () => ({ getContent: () => document.createElement("div") }) }]);
    map.getLevel.mockReturnValue(MAP_DETAIL_PIN_LEVEL);
    emit(map, "idle");
    expect(liveLabels()).toHaveLength(2);
  });

  it("이름표를 누르거나 Enter·Space를 누르면 그 핀을 고른 것과 같다", () => {
    const { layer, map, clusterer, emit, onSelect, liveLabels } = setup();
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL);
    layer.sync(items, null);
    emit(clusterer, "clustered", []);
    const [label] = liveLabels();
    expect(label).toHaveAttribute("role", "button");
    label.click();
    label.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    label.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onSelect.mock.calls).toEqual([["one"], ["one"], ["one"]]);
    layer.dispose();
    label.click();
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(liveLabels()).toEqual([]);
  });

  it("목록에서 펼친 집은 배지 안에 있어도 따로 핀과 이름을 보이고, 끝나면 걷는다", () => {
    const { layer, map, clusterer, created, emit, liveLabels } = setup();
    map.getLevel.mockReturnValue(MAP_SINGLE_PIN_LEVEL);
    layer.sync(items, "one");
    emit(clusterer, "clustered", [{ getSize: () => 2, getMarkers: () => created.slice(0, 2), getClusterMarker: () => ({ getContent: () => document.createElement("div") }) }]);
    layer.spotlight("one");
    expect(created).toHaveLength(3);
    expect(created[2].setMap).toHaveBeenLastCalledWith(map);
    expect(liveLabels().map((node) => node.textContent)).toEqual(["주택 하나"]);
    expect(liveLabels()[0]).toHaveClass("bg-brand");
    // 다시 칠해도 핀을 새로 꽂지 않는다 — 꽂을 때마다 깜빡인다
    emit(map, "idle");
    expect(created).toHaveLength(3);
    layer.spotlight(null);
    expect(created[2].setMap).toHaveBeenLastCalledWith(null);
    expect(liveLabels()).toEqual([]);
  });

  it("상세 지도는 확대 단계와 무관하게 핀을 고를 수 있다", () => {
    const { layer, map, created, emit, onSelect } = setup(false);
    layer.sync(items.slice(0, 1), null);
    map.getLevel.mockReturnValue(8);
    emit(created[0], "click");
    expect(onSelect).toHaveBeenCalledWith("one");
  });
});
