import { MAP_AGGREGATE_MIN_LEVEL, MAP_CLUSTER_OPTIONS, MAP_SINGLE_PIN_LEVEL, minClusterSizeFor } from "../../config/map";
import { MAP_CLUSTER_STYLE } from "../../config/mapClusterStyle";
import type { MapMarker } from "./types";

/**
 * 숫자 배지를 누르는 것은 그 자리의 공고를 모아 보는 일이고, 개별 핀을 누르는 것은 집 하나를 고르는 일이다.
 * 핀이 나올 수 있는 단계에서만 단일 선택을 받는다 — 한 건짜리는 이 단계부터 이미 핀이다.
 * 묶는 단계에서는 SDK가 핀을 배지 안에 감추므로 클릭 자체가 일어나지 않지만,
 * 그 규칙이 SDK 사정에 맡겨지지 않도록 여기서 한 번 더 막는다.
 */
const canSelectPin = (map: kakao.maps.Map, clustering: boolean) =>
  !clustering || map.getLevel() <= MAP_SINGLE_PIN_LEVEL;

export function createMarkerLayer(maps: typeof kakao.maps, map: kakao.maps.Map, clustering: boolean, onSelect: (id: string) => void, onGroupSelect?: (ids: string[]) => void) {
  const placed = new Map<string, { marker: kakao.maps.Marker; click: () => void; label: string }>();
  const markerIds = new Map<kakao.maps.Marker, string>();
  let selectedIds = new Set<string>();
  let decorated: { node: HTMLElement; ids: string[] }[] = [];
  const clusterer = clustering ? new maps.MarkerClusterer({
    map, ...MAP_CLUSTER_OPTIONS, averageCenter: true, disableClickZoom: true,
    styles: [MAP_CLUSTER_STYLE], texts: (size) => `${size}건`
  }) : null;
  let cleanKeyboard: (() => void)[] = [];

  const idsOf = (cluster: kakao.maps.Cluster) => cluster.getMarkers().flatMap((marker) => {
    const id = markerIds.get(marker);
    return id === undefined ? [] : [id];
  });
  const selectCluster = (cluster: kakao.maps.Cluster) => {
    const ids = idsOf(cluster);
    if (ids.length) onGroupSelect?.(ids);
  };
  const paintSelection = () => {
    decorated.forEach(({ node, ids }) => {
      const selected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
      node.setAttribute("aria-pressed", String(selected));
      node.classList.toggle("ring-4", selected);
      node.classList.toggle("ring-fg-heading", selected);
    });
  };
  const decorateClusters = (clusters: kakao.maps.Cluster[]) => {
    cleanKeyboard.forEach((clean) => clean());
    cleanKeyboard = [];
    decorated = [];
    for (const cluster of clusters) {
      // SDK는 현재 최소 크기를 만족하는 묶음만 넘겨주므로 크기는 다시 보지 않는다
      if (map.getLevel() < MAP_AGGREGATE_MIN_LEVEL) continue;
      const node = cluster.getClusterMarker().getContent();
      if (!(node instanceof HTMLElement)) continue;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `청약 ${cluster.getSize()}건 목록 보기`);
      node.tabIndex = 0;
      node.classList.add("focus-visible:outline", "focus-visible:outline-2", "focus-visible:outline-brand-dark");
      const keydown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        selectCluster(cluster);
      };
      node.addEventListener("keydown", keydown);
      cleanKeyboard.push(() => node.removeEventListener("keydown", keydown));
      decorated.push({ node, ids: idsOf(cluster) });
    }
    paintSelection();
  };
  /** 확대할수록 한 건짜리는 배지에서 핀으로 넘어간다. 값이 바뀔 때만 다시 그린다 */
  const applyZoomRule = () => {
    if (!clusterer) return;
    const next = minClusterSizeFor(map.getLevel());
    if (clusterer.getMinClusterSize() === next) return;
    clusterer.setMinClusterSize(next);
    clusterer.redraw();
  };

  if (clusterer) {
    maps.event.addListener(clusterer, "clusterclick", selectCluster);
    maps.event.addListener(clusterer, "clustered", decorateClusters);
    maps.event.addListener(map, "zoom_changed", applyZoomRule);
    applyZoomRule();
  }

  return {
    sync(items: MapMarker[], selectedId: string | null) {
      const next = new Map(items.map((item) => [item.id, item]));
      const removed: kakao.maps.Marker[] = [];
      placed.forEach(({ marker, click, label }, id) => {
        const item = next.get(id);
        // 묶음에 숨겨진 핀은 SDK 내부 DOM이 없다. 라벨 변경은 setTitle 대신 재생성한다.
        if (item && label === (item.label ?? "")) return;
        maps.event.removeListener(marker, "click", click);
        marker.setMap(null);
        removed.push(marker);
        markerIds.delete(marker);
        placed.delete(id);
      });
      if (removed.length) clusterer?.removeMarkers(removed, true);
      const added: kakao.maps.Marker[] = [];
      for (const item of items) {
        const position = new maps.LatLng(item.point.lat, item.point.lng);
        const existing = placed.get(item.id);
        if (existing) {
          existing.marker.setPosition(position);
        } else {
          const marker = new maps.Marker({ position, title: item.label, clickable: true });
          const click = () => { if (canSelectPin(map, clustering)) onSelect(item.id); };
          maps.event.addListener(marker, "click", click);
          placed.set(item.id, { marker, click, label: item.label ?? "" });
          markerIds.set(marker, item.id);
          if (clusterer) added.push(marker);
          else marker.setMap(map);
        }
      }
      if (added.length) clusterer?.addMarkers(added, true);
      placed.forEach(({ marker }, id) => marker.setZIndex(id === selectedId ? 1 : 0));
      applyZoomRule();
      clusterer?.redraw();
    },
    select(id: string | null) {
      placed.forEach(({ marker }, key) => marker.setZIndex(key === id ? 1 : 0));
    },
    selectGroup(ids: readonly string[]) {
      selectedIds = new Set(ids);
      paintSelection();
    },
    redraw() { clusterer?.redraw(); },
    dispose() {
      cleanKeyboard.forEach((clean) => clean());
      if (clusterer) {
        maps.event.removeListener(clusterer, "clusterclick", selectCluster);
        maps.event.removeListener(clusterer, "clustered", decorateClusters);
        maps.event.removeListener(map, "zoom_changed", applyZoomRule);
        clusterer.clear();
      }
      placed.forEach(({ marker, click }) => {
        maps.event.removeListener(marker, "click", click);
        marker.setMap(null);
      });
      placed.clear();
      markerIds.clear();
      decorated = [];
    }
  };
}
