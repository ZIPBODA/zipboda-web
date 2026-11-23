import { describe, expect, it, vi } from "vitest";
import { MAP_DETAIL_PIN_LEVEL, MAP_SINGLE_PIN_LEVEL } from "../../config/map";
import { createMarkerLayer } from "./createMarkerLayer";
import type { MapMarker } from "./types";

/** 1도 = 1,000px인 투영. 지도 픽셀 좌표는 x = 경도 × 1000, y = −위도 × 1000(아래로 갈수록 커진다) */
const PX_PER_DEGREE = 1000;

function setup({ clustering = true, level = MAP_SINGLE_PIN_LEVEL + 2 } = {}) {
  const listeners = new Map<object, Map<string, (...args: never[]) => void>>();
  const addListener = vi.fn((target: object, type: string, handler: (...args: never[]) => void) => {
    if (!listeners.has(target)) listeners.set(target, new Map());
    listeners.get(target)!.set(type, handler);
  });
  const removeListener = vi.fn((target: object, type: string) => { listeners.get(target)?.delete(type); });
  class LatLng { constructor(public lat: number, public lng: number) {} getLat() { return this.lat; } getLng() { return this.lng; } }
  class Point { constructor(public x: number, public y: number) {} }
  const created: Marker[] = [];
  class Marker {
    setMap = vi.fn(); setPosition = vi.fn(); setZIndex = vi.fn(); setTitle = vi.fn();
    constructor(public options: { position: LatLng; title?: string }) { created.push(this); }
  }
  const overlays: CustomOverlay[] = [];
  class CustomOverlay {
    setMap = vi.fn(); setZIndex = vi.fn(); setPosition = vi.fn();
    constructor(public options: { content: HTMLElement; position: LatLng; yAnchor?: number }) { overlays.push(this); }
  }
  const view = { south: 37, west: 126.5, north: 38, east: 127.5 };
  const inView = vi.fn(() => true);
  let currentLevel = level;
  const map = {
    getLevel: vi.fn(() => currentLevel),
    setLevel: vi.fn(),
    getBounds: () => ({ contain: inView, getSouthWest: () => new LatLng(view.south, view.west), getNorthEast: () => new LatLng(view.north, view.east) }),
    getProjection: () => ({
      pointFromCoords: (c: LatLng) => new Point(c.lng * PX_PER_DEGREE, -c.lat * PX_PER_DEGREE),
      coordsFromPoint: (p: Point) => new LatLng(-p.y / PX_PER_DEGREE, p.x / PX_PER_DEGREE)
    })
  };
  const maps = { LatLng, Point, Marker, CustomOverlay, event: { addListener, removeListener } };
  const onSelect = vi.fn();
  const onGroupSelect = vi.fn();
  const layer = createMarkerLayer(maps as unknown as typeof kakao.maps, map as unknown as kakao.maps.Map, clustering, onSelect, onGroupSelect);
  const emit = (target: object, type: string) => {
    const callback = listeners.get(target)?.get(type);
    if (callback) (callback as () => void)();
  };
  const badgeIn = (overlay: CustomOverlay) => overlay.options.content.querySelector<HTMLElement>(".map-cluster-badge");
  const isBadge = (overlay: CustomOverlay) => badgeIn(overlay) !== null;
  const isLive = (overlay: CustomOverlay) => overlay.setMap.mock.calls.at(-1)?.[0] !== null;
  return {
    layer, map, view, created, overlays, inView, emit, onSelect, onGroupSelect, removeListener,
    setLevel: (next: number) => { currentLevel = next; },
    /** 배율을 바꾸는 것은 카카오에서 zoom_changed 뒤 멈춤(idle)으로 끝난다 */
    zoomTo: (next: number) => { currentLevel = next; emit(map, "zoom_changed"); emit(map, "idle"); },
    liveBadges: () => overlays.filter((overlay) => isBadge(overlay) && isLive(overlay)),
    /** 지도에 떠 있는 배지 버튼(크기 없는 자리 상자 안) */
    badgeNodes: () => overlays.filter((overlay) => isBadge(overlay) && isLive(overlay)).map((overlay) => badgeIn(overlay)!),
    liveLabels: () => overlays.filter((overlay) => !isBadge(overlay) && isLive(overlay)).map((overlay) => overlay.options.content),
    shownPins: () => created.filter((marker) => marker.setMap.mock.calls.at(-1)?.[0] === map)
  };
}

const one: MapMarker = { id: "one", label: "주택 하나", point: { lat: 37.5, lng: 127 } };
/** one에서 50px 옆 — 격자(80px) 안 */
const near: MapMarker = { id: "near", label: "주택 이웃", point: { lat: 37.5, lng: 127.05 } };
/** one에서 가로·세로 100px — 격자 밖 */
const far: MapMarker = { id: "far", label: "주택 멀리", point: { lat: 37.6, lng: 127.1 } };

describe("지도 핀·숫자 배지", () => {
  it("멀리서는 한 건짜리도 '1건' 배지이고, 누르면 지도를 확대하지 않고 그 공고를 고른다", () => {
    const { layer, badgeNodes, shownPins, onGroupSelect, map } = setup();
    layer.sync([one], null);
    const [badge] = badgeNodes();
    expect(badge).toHaveTextContent("1건");
    expect(badge).toHaveAttribute("role", "button");
    expect(badge).toHaveAttribute("aria-label", "청약 1건 목록 보기");
    expect(badge.tabIndex).toBe(0);
    badge.click();
    expect(onGroupSelect).toHaveBeenLastCalledWith(["one"]);
    expect(map.setLevel).not.toHaveBeenCalled();
    expect(shownPins()).toEqual([]);
  });

  it("격자 안의 집은 한 배지로 묶고, 배지 클릭·Enter·Space는 그 공고들을 고르며, 정리하면 더 받지 않는다", () => {
    const { layer, liveBadges, badgeNodes, onGroupSelect } = setup();
    layer.sync([one, near, far], null);
    expect(badgeNodes().map((badge) => badge.textContent)).toEqual(["2건", "1건"]);
    const node = badgeNodes()[0];
    node.click();
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    node.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onGroupSelect.mock.calls).toEqual([[["one", "near"]], [["one", "near"]], [["one", "near"]]]);
    layer.dispose();
    node.click();
    expect(onGroupSelect).toHaveBeenCalledTimes(3);
    expect(liveBadges()).toEqual([]);
  });

  // SDK는 올리는 순간의 크기로 가운데를 잡아, 글자가 길어지면(100건 이상) 배지가 비껴 선다 — 크기 없는 상자 가운데에 CSS로 놓는다
  it("배지는 묶음 중심(더한 집의 평균)에 서고, 글자 폭과 상관없이 그 점 가운데에 놓인다", () => {
    const { layer, liveBadges, badgeNodes } = setup();
    layer.sync([one, near], null);
    const [overlay] = liveBadges();
    expect(overlay.options.position.lat).toBe(37.5);
    expect(overlay.options.position.lng).toBeCloseTo(127.025, 9);
    expect(overlay.options.content).toHaveClass("size-0");
    expect(badgeNodes()[0]).toHaveClass("absolute", "left-0", "top-0", "-translate-x-1/2", "-translate-y-1/2");
  });

  it("핀 단계에서는 한 건짜리를 핀으로 풀고, 여러 건은 배지로 둔다", () => {
    const { layer, badgeNodes, shownPins } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one, near, far], null);
    expect(badgeNodes().map((badge) => badge.textContent)).toEqual(["2건"]);
    expect(shownPins().map((marker) => marker.options.title)).toEqual(["주택 멀리"]);
  });

  // 같은 단지의 여러 공고는 좌표가 같아 최대 확대에서도 핀이 한 자리에 포개진다 — 그 자리만 배지로 묶어 목록으로 연다
  it("가장 가까운 단계에서는 같은 자리 핀만 배지로 묶고, 바로 옆 집은 핀이다", () => {
    const { layer, badgeNodes, shownPins, onGroupSelect } = setup({ level: MAP_DETAIL_PIN_LEVEL });
    layer.sync([{ ...one, id: "same-a" }, { ...one, id: "same-b" }, near], null);
    const [badge] = badgeNodes();
    expect(badge).toHaveTextContent("2건");
    badge.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onGroupSelect).toHaveBeenLastCalledWith(["same-a", "same-b"]);
    expect(shownPins().map((marker) => marker.options.title)).toEqual(["주택 이웃"]);
  });

  it("배율이 바뀌면 배지를 걷고, 멈추면 새 배율의 규칙으로 처음부터 다시 묶는다", () => {
    const { layer, liveBadges, badgeNodes, shownPins, zoomTo } = setup();
    layer.sync([one, near], null);
    expect(liveBadges()).toHaveLength(1);
    zoomTo(MAP_DETAIL_PIN_LEVEL);
    expect(liveBadges()).toEqual([]);
    expect(shownPins().map((marker) => marker.options.title)).toEqual(["주택 하나", "주택 이웃"]);
    zoomTo(MAP_SINGLE_PIN_LEVEL + 1);
    expect(badgeNodes().map((badge) => badge.textContent)).toEqual(["2건"]);
    expect(shownPins()).toEqual([]);
  });

  it("지도를 옮기면 새로 들어온 집만 기존 묶음에 더하고, 이미 묶은 집은 다시 묶지 않는다", () => {
    const { layer, view, overlays, liveBadges, badgeNodes, emit, map } = setup();
    // 처음 화면은 여유 폭(80px)을 더해도 one·near까지만 든다
    Object.assign(view, { south: 37.45, west: 126.95, north: 37.55, east: 126.99 });
    const joiner: MapMarker = { id: "joiner", point: { lat: 37.52, lng: 127.08 } };
    layer.sync([one, near, joiner], null);
    expect(badgeNodes().map((badge) => badge.textContent)).toEqual(["2건"]);
    const drawn = overlays.length;
    Object.assign(view, { east: 127.2 });
    emit(map, "idle");
    expect(overlays).toHaveLength(drawn);
    expect(badgeNodes()[0]).toHaveTextContent("3건");
    // 집이 더해져 평균 중심이 옮겨 간다
    expect(liveBadges()[0].setPosition).toHaveBeenLastCalledWith(expect.objectContaining({ lat: (37.5 + 37.5 + 37.52) / 3 }));
    emit(map, "idle");
    expect(badgeNodes()[0]).toHaveTextContent("3건");
  });

  it("화면에서 여유 폭(80px)보다 먼 집은 묶지도 핀으로 세우지도 않는다", () => {
    const { layer, view, liveBadges, shownPins } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    Object.assign(view, { south: 37.45, west: 126.95, north: 37.55, east: 127.01 });
    layer.sync([one, far], null);
    expect(liveBadges()).toEqual([]);
    expect(shownPins().map((marker) => marker.options.title)).toEqual(["주택 하나"]);
  });

  it("배지만 있는 단계에서는 핀 클릭이 공고를 고르지 않고, 핀 단계부터 고른다", () => {
    const { layer, created, emit, onSelect, setLevel } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one], null);
    setLevel(MAP_SINGLE_PIN_LEVEL + 1);
    emit(created[0], "click");
    expect(onSelect).not.toHaveBeenCalled();
    setLevel(MAP_SINGLE_PIN_LEVEL);
    emit(created[0], "click");
    expect(onSelect).toHaveBeenCalledWith("one");
  });

  it("필터에서 빠진 집은 걷고, 남은 핀은 새로 만들지 않고 자리만 옮긴다", () => {
    const { layer, created, emit, onSelect, removeListener } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one, far], null);
    expect(created).toHaveLength(2);
    const removed = created[1];
    layer.sync([{ ...one, point: { lat: 37.51, lng: 127.01 } }], "one");
    expect(created).toHaveLength(2);
    expect(removed.setMap).toHaveBeenLastCalledWith(null);
    expect(removeListener).toHaveBeenCalledWith(removed, "click", expect.any(Function));
    expect(created[0].setPosition).toHaveBeenCalledWith(expect.objectContaining({ lat: 37.51, lng: 127.01 }));
    emit(removed, "click");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("이름이 바뀐 핀은 SDK 마커의 제목을 고치지 않고 새로 만든다", () => {
    const { layer, created } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one], null);
    layer.sync([{ ...one, label: "수정된 이름" }], null);
    expect(created).toHaveLength(2);
    expect(created[0].setMap).toHaveBeenLastCalledWith(null);
    expect(created[1].options.title).toBe("수정된 이름");
    expect(created[0].setTitle).not.toHaveBeenCalled();
  });

  it("선택 변경은 다시 묶거나 확대 단계를 바꾸지 않는다", () => {
    const { layer, map, created, overlays } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one, far], "one");
    const drawn = overlays.length;
    layer.select("far");
    expect(created[1].setZIndex).toHaveBeenLastCalledWith(1);
    expect(created[0].setZIndex).toHaveBeenLastCalledWith(0);
    expect(created).toHaveLength(2);
    expect(overlays).toHaveLength(drawn);
    expect(map.setLevel).not.toHaveBeenCalled();
  });

  it("고른 묶음과 공고가 똑같은 배지만 눌린 것으로 보인다", () => {
    const { layer, badgeNodes } = setup();
    layer.sync([one, near, far], null);
    const [pair, single] = badgeNodes();
    layer.selectGroup(["near", "one"]);
    expect(pair).toHaveAttribute("aria-pressed", "true");
    expect(single).toHaveAttribute("aria-pressed", "false");
    layer.selectGroup(["one"]);
    expect(pair).toHaveAttribute("aria-pressed", "false");
  });

  it("핀 단계에서는 배지 밖의 집마다 이름표를 달고, 고른 집만 브랜드 색으로 위에 둔다", () => {
    const { layer, liveLabels } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one, far], "one");
    const [first, second] = liveLabels();
    expect(liveLabels().map((node) => node.textContent)).toEqual(["주택 하나", "주택 멀리"]);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveClass("bg-brand");
    expect(second).toHaveClass("bg-surface");
    layer.select("far");
    expect(first).toHaveClass("bg-surface");
    expect(second).toHaveClass("bg-brand");
  });

  it("배지에 묶인 집·화면 밖의 집·배지만 있는 단계에는 이름표를 달지 않는다", () => {
    const { layer, inView, emit, map, liveLabels, setLevel } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one, near], null);
    expect(liveLabels()).toEqual([]);
    layer.sync([one], null);
    expect(liveLabels()).toHaveLength(1);
    inView.mockImplementation(() => false);
    emit(map, "idle");
    expect(liveLabels()).toEqual([]);
    inView.mockImplementation(() => true);
    setLevel(MAP_SINGLE_PIN_LEVEL + 1);
    emit(map, "idle");
    expect(liveLabels()).toEqual([]);
  });

  it("최대 배율에서는 같은 자리 배지에 든 핀만 이름을 떼고, 따로 선 핀에는 이름을 단다", () => {
    const { layer, liveLabels } = setup({ level: MAP_DETAIL_PIN_LEVEL });
    layer.sync([one, { ...one, id: "one-again", label: "주택 하나 2차" }, near], null);
    expect(liveLabels().map((node) => node.textContent)).toEqual(["주택 이웃"]);
  });

  it("이름표를 누르거나 Enter·Space를 누르면 그 핀을 고른 것과 같다", () => {
    const { layer, onSelect, liveLabels } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one], null);
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
    const { layer, map, created, emit, liveLabels } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one, near], "one");
    expect(created).toHaveLength(0);
    layer.spotlight("one");
    expect(created).toHaveLength(1);
    expect(created[0].setMap).toHaveBeenLastCalledWith(map);
    expect(liveLabels().map((node) => node.textContent)).toEqual(["주택 하나"]);
    expect(liveLabels()[0]).toHaveClass("bg-brand");
    // 다시 칠해도 핀을 새로 꽂지 않는다 — 꽂을 때마다 깜빡인다
    emit(map, "idle");
    expect(created).toHaveLength(1);
    layer.spotlight(null);
    expect(created[0].setMap).toHaveBeenLastCalledWith(null);
    expect(liveLabels()).toEqual([]);
  });

  // 가장 가까운 단계의 배지는 같은 자리 묶음이라, 펼친 집에 핀을 따로 꽂으면 배지를 그대로 덮는다
  it("가장 가까운 단계에서 같은 자리 배지에 든 집을 펼치면 이름표만 띄우고 핀은 꽂지 않는다", () => {
    const { layer, created, liveLabels, badgeNodes } = setup({ level: MAP_DETAIL_PIN_LEVEL });
    layer.sync([one, { ...one, id: "one-again", label: "주택 하나 2차" }], "one");
    layer.spotlight("one");
    expect(created).toHaveLength(0);
    expect(liveLabels().map((node) => node.textContent)).toEqual(["주택 하나"]);
    expect(badgeNodes()).toHaveLength(1);
  });

  it("정리할 때 지도 핀·배지·이벤트를 모두 해제한다", () => {
    const { layer, created, emit, onSelect, map, removeListener, liveBadges } = setup({ level: MAP_SINGLE_PIN_LEVEL });
    layer.sync([one, near, far], null);
    layer.dispose();
    expect(liveBadges()).toEqual([]);
    created.forEach((marker) => {
      expect(marker.setMap).toHaveBeenLastCalledWith(null);
      emit(marker, "click");
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith(map, "idle", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith(map, "zoom_changed", expect.any(Function));
  });

  it("상세 지도에서는 묶지 않고 핀을 바로 세우며, 확대 단계와 상관없이 고를 수 있다", () => {
    const { layer, map, created, overlays, emit, onSelect } = setup({ clustering: false, level: 8 });
    layer.sync([one, near], null);
    expect(created.map((marker) => marker.setMap.mock.calls.at(-1)?.[0])).toEqual([map, map]);
    expect(overlays).toEqual([]);
    emit(created[0], "click");
    expect(onSelect).toHaveBeenCalledWith("one");
  });

  it("상세 지도는 다시 받아도 이미 선 핀을 다시 올리지 않고 자리만 옮긴다 — 다시 올리면 깜빡인다", () => {
    const { layer, map, created } = setup({ clustering: false });
    layer.sync([one], null);
    layer.sync([{ ...one, point: { lat: 37.51, lng: 127.01 } }], null);
    expect(created).toHaveLength(1);
    expect(created[0].setMap.mock.calls).toEqual([[map]]);
    expect(created[0].setPosition).toHaveBeenCalledWith(expect.objectContaining({ lat: 37.51, lng: 127.01 }));
  });
});
