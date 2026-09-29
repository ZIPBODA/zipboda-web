import { MAP_AGGREGATE_MIN_LEVEL, MAP_CLUSTER_OPTIONS, MAP_PIN_LABEL_Z_INDEX, MAP_SINGLE_PIN_LEVEL, minClusterSizeFor } from "../../config/map";
import { MAP_CLUSTER_STYLE } from "../../config/mapClusterStyle";
import { createPinLabel } from "./pinLabel";
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
  const placed = new Map<string, { marker: kakao.maps.Marker; click: () => void; label: string; position: kakao.maps.LatLng }>();
  const markerIds = new Map<kakao.maps.Marker, string>();
  let selectedIds = new Set<string>();
  let selectedId: string | null = null;
  let spotlightId: string | null = null;
  let badgedIds = new Set<string>();
  let decorated: { node: HTMLElement; ids: string[] }[] = [];
  const labels = new Map<string, { overlay: kakao.maps.CustomOverlay; name: string; view: ReturnType<typeof createPinLabel> }>();
  let spotlightPin: { id: string; marker: kakao.maps.Marker } | null = null;
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
      const selected = ids.length > 0 && ids.length === selectedIds.size && ids.every((id) => selectedIds.has(id));
      node.setAttribute("aria-pressed", String(selected));
    });
  };
  const removeLabel = (id: string) => {
    const entry = labels.get(id);
    if (!entry) return;
    entry.overlay.setMap(null);
    entry.view.dispose();
    labels.delete(id);
  };
  /**
   * 핀으로 보이는 집에는 모두 이름을 단다. 배지 안에 숨은 집은 이름도 숨는다.
   * 다만 목록에서 펼친 집(spotlight)은 배지 안에 있어도 따로 핀을 꽂아 이름과 함께 보여준다.
   */
  const paintLabels = () => {
    if (!clusterer) return;
    const aggregating = map.getLevel() >= MAP_AGGREGATE_MIN_LEVEL;
    // 이 단계 밖에서는 한 건도 배지이므로 묶음 결과를 기다리지 않고 이름을 뗀다
    const pinsPossible = map.getLevel() <= MAP_SINGLE_PIN_LEVEL;
    const bounds = map.getBounds();
    const wanted = new Map<string, { name: string; position: kakao.maps.LatLng }>();
    placed.forEach(({ label, position }, id) => {
      const pinShown = pinsPossible && !(aggregating && badgedIds.has(id)) && bounds.contain(position);
      if (label && (pinShown || id === spotlightId)) wanted.set(id, { name: label, position });
    });
    labels.forEach((entry, id) => { if (wanted.get(id)?.name !== entry.name) removeLabel(id); });
    wanted.forEach(({ name, position }, id) => {
      const selected = id === selectedId;
      let entry = labels.get(id);
      if (entry) {
        entry.view.paint(selected);
      } else {
        const view = createPinLabel(name, () => { if (canSelectPin(map, clustering)) onSelect(id); });
        // SDK는 지도에 올리는 순간의 크기로 핀 위 자리를 잡는다. 여백·글자 크기가 붙기 전에 올리면 이름표가 핀을 덮는다
        view.paint(selected);
        const overlay = new maps.CustomOverlay({ map, position, content: view.node, yAnchor: 1, clickable: true });
        entry = { overlay, name, view };
        labels.set(id, entry);
      }
      entry.overlay.setZIndex(selected ? MAP_PIN_LABEL_Z_INDEX.selected : MAP_PIN_LABEL_Z_INDEX.idle);
    });
    const hidden = spotlightId !== null && aggregating && badgedIds.has(spotlightId) ? placed.get(spotlightId) : undefined;
    const hiddenId = hidden ? spotlightId : null;
    if (spotlightPin?.id === hiddenId) return;
    spotlightPin?.marker.setMap(null);
    spotlightPin = null;
    if (!hidden || hiddenId === null) return;
    spotlightPin = { id: hiddenId, marker: new maps.Marker({ position: hidden.position, title: hidden.label, zIndex: MAP_PIN_LABEL_Z_INDEX.idle }) };
    spotlightPin.marker.setMap(map);
  };
  const decorateClusters = (clusters: kakao.maps.Cluster[]) => {
    cleanKeyboard.forEach((clean) => clean());
    cleanKeyboard = [];
    decorated = [];
    badgedIds = map.getLevel() < MAP_AGGREGATE_MIN_LEVEL ? new Set() : new Set(clusters.flatMap(idsOf));
    for (const cluster of clusters) {
      // SDK는 현재 최소 크기를 만족하는 묶음만 넘겨주므로 크기는 다시 보지 않는다
      if (map.getLevel() < MAP_AGGREGATE_MIN_LEVEL) continue;
      const node = cluster.getClusterMarker().getContent();
      if (!(node instanceof HTMLElement)) continue;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `청약 ${cluster.getSize()}건 목록 보기`);
      node.tabIndex = 0;
      node.classList.add("map-cluster-badge", "focus-visible:outline", "focus-visible:outline-2", "focus-visible:outline-brand");
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
    paintLabels();
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
    // 묶음을 그리지 않는 최대 배율과 화면 밖에서 들어온 핀은 clustered 없이도 이름이 필요하다
    maps.event.addListener(map, "idle", paintLabels);
    applyZoomRule();
  }

  return {
    sync(items: MapMarker[], selected: string | null) {
      selectedId = selected;
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
          existing.position = position;
          labels.get(item.id)?.overlay.setPosition(position);
        } else {
          const marker = new maps.Marker({ position, title: item.label, clickable: true });
          const click = () => { if (canSelectPin(map, clustering)) onSelect(item.id); };
          maps.event.addListener(marker, "click", click);
          placed.set(item.id, { marker, click, label: item.label ?? "", position });
          markerIds.set(marker, item.id);
          if (clusterer) added.push(marker);
          else marker.setMap(map);
        }
      }
      if (added.length) clusterer?.addMarkers(added, true);
      placed.forEach(({ marker }, id) => marker.setZIndex(id === selected ? 1 : 0));
      applyZoomRule();
      clusterer?.redraw();
      paintLabels();
    },
    select(id: string | null) {
      selectedId = id;
      placed.forEach(({ marker }, key) => marker.setZIndex(key === id ? 1 : 0));
      paintLabels();
    },
    selectGroup(ids: readonly string[]) {
      selectedIds = new Set(ids);
      paintSelection();
    },
    /** 목록에서 펼친 집은 배지에 묶일 배율이어도 핀과 이름으로 드러낸다 */
    spotlight(id: string | null) {
      spotlightId = id;
      paintLabels();
    },
    redraw() { clusterer?.redraw(); },
    dispose() {
      cleanKeyboard.forEach((clean) => clean());
      if (clusterer) {
        maps.event.removeListener(clusterer, "clusterclick", selectCluster);
        maps.event.removeListener(clusterer, "clustered", decorateClusters);
        maps.event.removeListener(map, "zoom_changed", applyZoomRule);
        maps.event.removeListener(map, "idle", paintLabels);
        clusterer.clear();
      }
      [...labels.keys()].forEach(removeLabel);
      spotlightPin?.marker.setMap(null);
      spotlightPin = null;
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
