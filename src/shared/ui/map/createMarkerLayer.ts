import { MAP_AGGREGATE_MIN_LEVEL, MAP_CLUSTER_OPTIONS, MAP_DETAIL_PIN_LEVEL, MAP_ZOOM_RANGE } from "../../config/map";
import { MAP_CLUSTER_STYLE } from "../../config/mapClusterStyle";
import type { MapMarker } from "./types";

/**
 * 숫자 배지를 누르는 것은 지도 탐색이고, 개별 핀을 누르는 것은 집을 고르는 일이다.
 * 묶는 단계에서는 SDK가 핀을 배지 안에 감추므로 핀 클릭 자체가 일어나지 않지만,
 * 그 규칙이 SDK 사정에 맡겨지지 않도록 여기서 한 번 더 막는다.
 */
const isDetailLevel = (map: kakao.maps.Map, clustering: boolean) =>
  !clustering || map.getLevel() <= MAP_DETAIL_PIN_LEVEL;

export function createMarkerLayer(maps: typeof kakao.maps, map: kakao.maps.Map, clustering: boolean, onSelect: (id: string) => void) {
  const placed = new Map<string, { marker: kakao.maps.Marker; click: () => void; label: string }>();
  const clusterer = clustering ? new maps.MarkerClusterer({
    map, ...MAP_CLUSTER_OPTIONS, averageCenter: true, disableClickZoom: true,
    styles: [MAP_CLUSTER_STYLE], texts: (size) => `${size}건`
  }) : null;
  let cleanKeyboard: (() => void)[] = [];

  const zoomCluster = (cluster: kakao.maps.Cluster) => {
    map.setLevel(Math.max(MAP_ZOOM_RANGE.min, map.getLevel() - 1), { anchor: cluster.getCenter() });
  };
  const decorateClusters = (clusters: kakao.maps.Cluster[]) => {
    cleanKeyboard.forEach((clean) => clean());
    cleanKeyboard = [];
    for (const cluster of clusters) {
      if (cluster.getSize() < MAP_CLUSTER_OPTIONS.minClusterSize || map.getLevel() < MAP_AGGREGATE_MIN_LEVEL) continue;
      const node = cluster.getClusterMarker().getContent();
      if (!(node instanceof HTMLElement)) continue;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `주택 ${cluster.getSize()}건 모아보기, 지도 확대`);
      node.tabIndex = 0;
      node.classList.add("focus-visible:outline", "focus-visible:outline-2", "focus-visible:outline-brand-dark");
      const keydown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        zoomCluster(cluster);
      };
      node.addEventListener("keydown", keydown);
      cleanKeyboard.push(() => node.removeEventListener("keydown", keydown));
    }
  };
  if (clusterer) {
    maps.event.addListener(clusterer, "clusterclick", zoomCluster);
    maps.event.addListener(clusterer, "clustered", decorateClusters);
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
          const click = () => { if (isDetailLevel(map, clustering)) onSelect(item.id); };
          maps.event.addListener(marker, "click", click);
          placed.set(item.id, { marker, click, label: item.label ?? "" });
          if (clusterer) added.push(marker);
          else marker.setMap(map);
        }
      }
      if (added.length) clusterer?.addMarkers(added, true);
      placed.forEach(({ marker }, id) => marker.setZIndex(id === selectedId ? 1 : 0));
      clusterer?.redraw();
    },
    select(id: string | null) {
      placed.forEach(({ marker }, key) => marker.setZIndex(key === id ? 1 : 0));
    },
    redraw() { clusterer?.redraw(); },
    dispose() {
      cleanKeyboard.forEach((clean) => clean());
      if (clusterer) {
        maps.event.removeListener(clusterer, "clusterclick", zoomCluster);
        maps.event.removeListener(clusterer, "clustered", decorateClusters);
        clusterer.clear();
      }
      placed.forEach(({ marker, click }) => {
        maps.event.removeListener(marker, "click", click);
        marker.setMap(null);
      });
      placed.clear();
    }
  };
}
