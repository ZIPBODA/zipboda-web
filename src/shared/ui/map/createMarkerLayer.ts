import { MAP_CLUSTER_VIEW_MARGIN, MAP_DETAIL_PIN_LEVEL, MAP_PIN_LABEL_Z_INDEX, MAP_SINGLE_PIN_LEVEL, clusterGridSizeFor, minClusterSizeFor } from "../../config/map";
import { MAP_CLUSTER_STYLE } from "../../config/mapClusterStyle";
import { addToNearestCluster, type PinCluster } from "../../lib/markerClusters";
import { createPinLabel } from "./pinLabel";
import type { MapMarker } from "./types";

/**
 * 숫자 배지를 누르는 것은 그 자리의 공고를 모아 보는 일이고, 개별 핀을 누르는 것은 집 하나를 고르는 일이다.
 * 핀이 나올 수 있는 단계에서만 단일 선택을 받는다 — 한 건짜리는 이 단계부터 이미 핀이다.
 * 묶는 단계에서는 핀이 배지 안에 숨어 클릭 자체가 일어나지 않지만, 그 규칙을 여기서 한 번 더 막는다.
 */
const canSelectPin = (map: kakao.maps.Map, clustering: boolean) =>
  !clustering || map.getLevel() <= MAP_SINGLE_PIN_LEVEL;

interface Placed {
  id: string;
  label: string;
  position: kakao.maps.LatLng;
  /** 핀으로 처음 보일 때 만든다 — 배지 안에만 있는 집까지 SDK 마커를 만들 필요가 없다 */
  marker: kakao.maps.Marker | null;
  click: (() => void) | null;
}

interface Badge {
  cluster: PinCluster;
  node: HTMLElement;
  overlay: kakao.maps.CustomOverlay;
  ids: string[];
  dispose: () => void;
}

/**
 * 지도 위 집 핀과 숫자 배지. 묶음은 카카오 MarkerClusterer와 같은 규칙으로 직접 계산한다(markerClusters) —
 * 화면을 여유 폭만큼 넓힌 범위의 집만, 받은 순서대로 묶고, 확대·축소하면 처음부터, 옮기면 새로 들어온 집만 더한다.
 */
export function createMarkerLayer(maps: typeof kakao.maps, map: kakao.maps.Map, clustering: boolean, onSelect: (id: string) => void, onGroupSelect?: (ids: string[]) => void) {
  const placed = new Map<string, Placed>();
  let clusters: PinCluster[] = [];
  const clustered = new Set<string>();
  const badges = new Map<PinCluster, Badge>();
  let badgedIds = new Set<string>();
  let selectedIds = new Set<string>();
  let selectedId: string | null = null;
  let spotlightId: string | null = null;
  const labels = new Map<string, { overlay: kakao.maps.CustomOverlay; name: string; view: ReturnType<typeof createPinLabel> }>();
  let spotlightPin: { id: string; marker: kakao.maps.Marker } | null = null;
  let minClusterSize = minClusterSizeFor(map.getLevel());
  let gridSize = clusterGridSizeFor(map.getLevel());

  const pinOf = (entry: Placed) => {
    if (!entry.marker) {
      const marker = new maps.Marker({ position: entry.position, title: entry.label, clickable: true });
      const click = () => { if (canSelectPin(map, clustering)) onSelect(entry.id); };
      maps.event.addListener(marker, "click", click);
      marker.setZIndex(entry.id === selectedId ? 1 : 0);
      entry.marker = marker;
      entry.click = click;
    }
    return entry.marker;
  };
  const dropPin = (entry: Placed) => {
    if (!entry.marker || !entry.click) return;
    maps.event.removeListener(entry.marker, "click", entry.click);
    entry.marker.setMap(null);
    entry.marker = null;
    entry.click = null;
  };

  const paintSelection = () => {
    badges.forEach(({ node, ids }) => {
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
    if (!clustering) return;
    // 이 단계 밖에서는 한 건도 배지이므로 이름을 뗀다
    const pinsPossible = map.getLevel() <= MAP_SINGLE_PIN_LEVEL;
    const bounds = map.getBounds();
    const wanted = new Map<string, { name: string; position: kakao.maps.LatLng }>();
    placed.forEach(({ label, position }, id) => {
      const pinShown = pinsPossible && clustered.has(id) && !badgedIds.has(id) && bounds.contain(position);
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
    // 가장 가까운 단계의 배지는 같은 자리(같은 단지) 묶음이라 따로 꽂은 핀이 배지를 그대로 덮는다 — 그때는 이름표만 띄운다
    const pinCoversBadge = map.getLevel() <= MAP_DETAIL_PIN_LEVEL;
    const hidden = spotlightId !== null && !pinCoversBadge && badgedIds.has(spotlightId) ? placed.get(spotlightId) : undefined;
    const hiddenId = hidden ? spotlightId : null;
    if (spotlightPin?.id === hiddenId) return;
    spotlightPin?.marker.setMap(null);
    spotlightPin = null;
    if (!hidden || hiddenId === null) return;
    spotlightPin = { id: hiddenId, marker: new maps.Marker({ position: hidden.position, title: hidden.label, zIndex: MAP_PIN_LABEL_Z_INDEX.idle }) };
    spotlightPin.marker.setMap(map);
  };

  const centerOf = (cluster: PinCluster) => map.getProjection().coordsFromPoint(new maps.Point(cluster.x, cluster.y));
  const createBadge = (cluster: PinCluster): Badge => {
    // SDK는 지도에 올리는 순간의 크기로 가운데를 잡아, 나중에 글자가 길어지면(100건 이상) 배지가 비껴 선다.
    // 크기 없는 상자를 좌표에 두고 배지를 CSS로 그 가운데에 놓아, 글자 폭과 상관없이 묶음 중심에 선다
    const anchor = document.createElement("div");
    anchor.className = "relative size-0";
    const node = document.createElement("div");
    Object.assign(node.style, MAP_CLUSTER_STYLE, { cursor: "pointer" });
    node.setAttribute("role", "button");
    node.tabIndex = 0;
    node.className = "map-cluster-badge absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";
    anchor.append(node);
    const badge: Badge = { cluster, node, ids: [], overlay: new maps.CustomOverlay({ map, position: centerOf(cluster), content: anchor, clickable: true }), dispose: () => undefined };
    // 배지를 누르는 것은 그 자리의 공고를 모아 보는 일이다 — 지도를 확대하지 않는다
    const choose = () => { if (badge.ids.length) onGroupSelect?.([...badge.ids]); };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      choose();
    };
    // 배지를 누르다 끌어도 지도 끌기·글자 선택이 시작되지 않게 한다(카카오 묶음 배지와 같다)
    const holdDefault = (event: MouseEvent) => event.preventDefault();
    node.addEventListener("click", choose);
    node.addEventListener("keydown", keydown);
    node.addEventListener("mousedown", holdDefault);
    badge.dispose = () => {
      node.removeEventListener("click", choose);
      node.removeEventListener("keydown", keydown);
      node.removeEventListener("mousedown", holdDefault);
      badge.overlay.setMap(null);
    };
    return badge;
  };
  const show = (cluster: PinCluster) => {
    const members = cluster.ids.flatMap((id) => placed.get(id) ?? []);
    const existing = badges.get(cluster);
    if (cluster.ids.length < minClusterSize) {
      existing?.dispose();
      badges.delete(cluster);
      members.forEach((entry) => pinOf(entry).setMap(map));
      return;
    }
    members.forEach((entry) => entry.marker?.setMap(null));
    // 이미 선 배지에 집이 더해지면 평균 중심이 움직인다
    existing?.overlay.setPosition(centerOf(cluster));
    const badge = existing ?? createBadge(cluster);
    badges.set(cluster, badge);
    badge.ids = [...cluster.ids];
    badge.node.textContent = `${cluster.ids.length}건`;
    badge.node.setAttribute("aria-label", `청약 ${cluster.ids.length}건 목록 보기`);
  };
  const reset = () => {
    badges.forEach((badge) => badge.dispose());
    badges.clear();
    placed.forEach((entry) => entry.marker?.setMap(null));
    clusters = [];
    clustered.clear();
    badgedIds = new Set();
  };
  // 지도를 옮길 때는 이미 선 묶음을 그대로 두고 새로 들어온 집만 더한다 — 끌 때마다 배지가 갈리지 않게(카카오와 같다)
  const clusterVisible = () => {
    const projection = map.getProjection();
    const bounds = map.getBounds();
    const southWest = projection.pointFromCoords(bounds.getSouthWest());
    const northEast = projection.pointFromCoords(bounds.getNorthEast());
    const left = southWest.x - MAP_CLUSTER_VIEW_MARGIN;
    const right = northEast.x + MAP_CLUSTER_VIEW_MARGIN;
    const top = northEast.y - MAP_CLUSTER_VIEW_MARGIN;
    const bottom = southWest.y + MAP_CLUSTER_VIEW_MARGIN;
    const touched = new Set<PinCluster>();
    placed.forEach((entry, id) => {
      if (clustered.has(id)) return;
      const point = projection.pointFromCoords(entry.position);
      if (point.x < left || right < point.x || point.y < top || bottom < point.y) return;
      touched.add(addToNearestCluster(clusters, { id, x: point.x, y: point.y }, gridSize));
      clustered.add(id);
    });
    touched.forEach(show);
    badgedIds = new Set([...badges.values()].flatMap((badge) => badge.ids));
    paintSelection();
    paintLabels();
  };
  const recluster = () => {
    reset();
    clusterVisible();
  };
  /** 확대할수록 한 건짜리는 배지에서 핀으로 넘어가고, 가장 가까운 단계에서는 같은 자리만 묶는다 */
  const applyZoomRule = () => {
    minClusterSize = minClusterSizeFor(map.getLevel());
    gridSize = clusterGridSizeFor(map.getLevel());
  };
  // 배율이 바뀌면 묶음이 모두 달라진다. 확대 애니메이션 동안은 비워 두고, 멈추면(idle) 새 배율로 다시 묶는다
  const onZoomChanged = () => {
    applyZoomRule();
    reset();
  };

  if (clustering) {
    maps.event.addListener(map, "zoom_changed", onZoomChanged);
    maps.event.addListener(map, "idle", clusterVisible);
  }

  return {
    sync(items: MapMarker[], selected: string | null) {
      selectedId = selected;
      const next = new Map(items.map((item) => [item.id, item]));
      placed.forEach((entry, id) => {
        const item = next.get(id);
        if (item && entry.label === (item.label ?? "")) return;
        // 이름이 바뀐 핀은 SDK 마커의 제목을 고치지 않고 새로 만든다
        dropPin(entry);
        removeLabel(id);
        placed.delete(id);
      });
      for (const item of items) {
        const position = new maps.LatLng(item.point.lat, item.point.lng);
        const existing = placed.get(item.id);
        if (existing) {
          existing.position = position;
          existing.marker?.setPosition(position);
          labels.get(item.id)?.overlay.setPosition(position);
        } else {
          placed.set(item.id, { id: item.id, label: item.label ?? "", position, marker: null, click: null });
        }
      }
      if (!clustering) {
        // 이미 선 핀을 다시 올리면 SDK가 떼었다 붙여 깜빡인다 — 새로 만든 핀만 올린다
        placed.forEach((entry) => { if (!entry.marker) pinOf(entry).setMap(map); });
        return;
      }
      recluster();
    },
    select(id: string | null) {
      selectedId = id;
      placed.forEach(({ marker }, key) => marker?.setZIndex(key === id ? 1 : 0));
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
    redraw() { if (clustering) recluster(); },
    dispose() {
      if (clustering) {
        maps.event.removeListener(map, "zoom_changed", onZoomChanged);
        maps.event.removeListener(map, "idle", clusterVisible);
      }
      reset();
      [...labels.keys()].forEach(removeLabel);
      spotlightPin?.marker.setMap(null);
      spotlightPin = null;
      placed.forEach(dropPin);
      placed.clear();
    }
  };
}
