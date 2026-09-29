"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAP_LEVEL, MAP_FOCUS_ANIMATION_MS, MAP_FOCUS_LEVEL, MAP_SINGLE_MARKER_LEVEL, MAP_SINGLE_PIN_LEVEL, MAP_ZOOM_RANGE } from "../../config/map";
import { boundsOf } from "../../lib/geo";
import { loadKakaoMaps, type MapSdkStatus } from "../../lib/kakaoMapLoader";
import { cn } from "../cn";
import { createMarkerLayer } from "./createMarkerLayer";
import type { MapViewProps } from "./types";

export function KakaoMapView({
  markers, center = null, level = MAP_LEVEL.detail, interactive = true, clustering = false,
  selectedId = null, onSelect, onVisibleMarkersChange, fallback = null, className, ariaLabel = "지도",
  initialCenter, fitPadding, controlsClassName, onGroupSelect, selectedIds, fitRequest = 0, locationRequest, mapType, focusRequest, attributionCorner, initialViewport, onViewportChange
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<ReturnType<typeof createMarkerLayer> | null>(null);
  const viewportCenter = useRef<kakao.maps.LatLng | null>(null);
  const viewportSize = useRef<{ width: number; height: number } | null>(null);
  const callbacks = useRef({ onSelect, onGroupSelect, onVisibleMarkersChange, onViewportChange });
  callbacks.current = { onSelect, onGroupSelect, onVisibleMarkersChange, onViewportChange };
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [zoom, setZoom] = useState(level);
  const [status, setStatus] = useState<MapSdkStatus | "loading">("loading");
  const hasPlace = markers.length > 0 || center !== null || initialCenter !== undefined || initialViewport !== undefined;
  const framedMap = useRef<kakao.maps.Map | null>(null);
  const handledFit = useRef(0);

  useEffect(() => {
    if (!hasPlace) return;
    let cancelled = false;
    setStatus("loading");
    setMap(null);
    viewportCenter.current = null;
    viewportSize.current = null;
    void loadKakaoMaps().then((result) => {
      if (cancelled) return;
      if (result.status !== "ready" || !result.maps || !containerRef.current) {
        setStatus(result.status);
        return;
      }
      const maps = result.maps;
      if (clustering && typeof maps.MarkerClusterer !== "function") {
        setStatus("failed");
        return;
      }
      const origin = initialViewport?.center ?? center ?? markers[0]?.point ?? initialCenter;
      if (!origin) return;
      const instance = new maps.Map(containerRef.current, {
        center: new maps.LatLng(origin.lat, origin.lng), level: initialViewport?.level ?? level,
        draggable: interactive, scrollwheel: interactive, disableDoubleClickZoom: !interactive
      });
      setMap(instance);
      setStatus("ready");
    });
    return () => { cancelled = true; };
    // 좌표·선택 변화는 아래 effect에서 갱신해 사용자의 확대·이동 상태를 유지한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPlace, interactive, clustering]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!map || !maps || !hasPlace) return;
    const layer = createMarkerLayer(maps, map, clustering, (id) => callbacks.current.onSelect?.(id), (ids) => callbacks.current.onGroupSelect?.(ids));
    layerRef.current = layer;
    return () => { layer.dispose(); layerRef.current = null; };
  }, [map, clustering, hasPlace]);

  useEffect(() => {
    layerRef.current?.sync(markers, selectedId);
    // 선택만 바뀌면 마커를 재배치하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, markers, clustering, hasPlace]);

  useEffect(() => { layerRef.current?.select(selectedId); }, [selectedId]);
  useEffect(() => { layerRef.current?.selectGroup(selectedIds ?? []); }, [map, selectedIds]);

  useEffect(() => { layerRef.current?.spotlight(focusRequest ? selectedId : null); }, [map, focusRequest, selectedId]);

  const frame = useCallback((instance: kakao.maps.Map) => {
    const maps = window.kakao?.maps;
    if (!maps) return;
    if (center) {
      instance.setCenter(new maps.LatLng(center.lat, center.lng));
      return;
    }
    const bounds = boundsOf(markers.map((marker) => marker.point));
    if (!bounds) return;
    if (markers.length === 1) {
      instance.setCenter(new maps.LatLng(bounds.south, bounds.west));
      instance.setLevel(clustering ? Math.max(level, MAP_SINGLE_PIN_LEVEL + 1) : MAP_SINGLE_MARKER_LEVEL);
      return;
    }
    const area = new maps.LatLngBounds(new maps.LatLng(bounds.south, bounds.west), new maps.LatLng(bounds.north, bounds.east));
    if (fitPadding) instance.setBounds(area, ...fitPadding);
    else instance.setBounds(area);
    if (clustering && instance.getLevel() <= MAP_SINGLE_PIN_LEVEL) instance.setLevel(MAP_SINGLE_PIN_LEVEL + 1);
  }, [center, markers, fitPadding, clustering, level]);

  /** 지난번 자리가 있으면 그리로, 없으면 마커 전체에 맞춘다. 전체 위치 요청은 언제나 맞춘다 */
  const place = useCallback((instance: kakao.maps.Map) => {
    const maps = window.kakao?.maps;
    if (!initialViewport || !maps) { frame(instance); return; }
    instance.setLevel(initialViewport.level);
    instance.setCenter(new maps.LatLng(initialViewport.center.lat, initialViewport.center.lng));
  }, [frame, initialViewport]);

  useEffect(() => {
    if (!map || handledFit.current === fitRequest) return;
    handledFit.current = fitRequest;
    frame(map);
  }, [map, fitRequest, frame]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    if (map && maps && locationRequest) map.setCenter(new maps.LatLng(locationRequest.lat, locationRequest.lng));
  }, [map, locationRequest]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    if (map && maps && mapType) map.setMapTypeId(mapType === "hybrid" ? maps.MapTypeId.HYBRID : maps.MapTypeId.ROADMAP);
  }, [map, mapType]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!map || !maps || !attributionCorner) return;
    map.setCopyrightPosition(attributionCorner === "bottom-right" ? maps.CopyrightPosition.BOTTOMRIGHT : maps.CopyrightPosition.BOTTOMLEFT);
  }, [map, attributionCorner]);

  /**
   * 전체 맞춤은 지도를 처음 열 때 한 번만 한다.
   * 필터를 누를 때마다 서울 전체로 되돌아가면 보고 있던 동네를 잃는다 — 마커만 갈아 낀다.
   * 중심을 직접 받는 지도(상세의 단일 위치)는 그 좌표를 계속 따른다.
   */
  useEffect(() => {
    if (!map) return;
    if (center) { frame(map); return; }
    if (framedMap.current === map) return;
    framedMap.current = map;
    place(map);
  }, [frame, place, map, center]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    const updateViewport = () => {
      setZoom(map.getLevel());
      const size = { width: containerRef.current?.clientWidth ?? 0, height: containerRef.current?.clientHeight ?? 0 };
      const previousSize = viewportSize.current;
      if (!previousSize || (previousSize.width === size.width && previousSize.height === size.height)) {
        viewportCenter.current = map.getCenter();
      }
      if (!previousSize) viewportSize.current = size;
      const middle = map.getCenter();
      callbacks.current.onViewportChange?.({ center: { lat: middle.getLat(), lng: middle.getLng() }, level: map.getLevel() });
      const bounds = map.getBounds();
      callbacks.current.onVisibleMarkersChange?.(markers.filter((item) => bounds.contain(new maps.LatLng(item.point.lat, item.point.lng))).map((item) => item.id));
    };
    maps.event.addListener(map, "idle", updateViewport);
    updateViewport();
    return () => maps.event.removeListener(map, "idle", updateViewport);
  }, [map, markers]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !map) return;
    let hadSize = container.clientWidth > 0 && container.clientHeight > 0;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth === 0 || container.clientHeight === 0) { hadSize = false; return; }
      // SDK의 getCenter는 새 컨테이너 크기의 영향을 받으므로 마지막 이동 완료 시점을 보존한다.
      const previousCenter = viewportCenter.current ?? map.getCenter();
      viewportSize.current = { width: container.clientWidth, height: container.clientHeight };
      map.relayout();
      if (hadSize) {
        map.setCenter(previousCenter);
        // relayout 직후 idle의 픽셀 반올림이 다음 패널 개폐마다 누적되지 않도록 기준 좌표를 유지한다.
        viewportCenter.current = previousCenter;
      }
      else { framedMap.current = map; place(map); }
      hadSize = true;
      layerRef.current?.redraw();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, place]);

  /**
   * 목록에서 고른 집으로는 이동과 확대를 SDK의 jump 한 번으로 끝낸다.
   * 프레임마다 중심을 옮기고 두 단계씩 끊어 확대하면 카카오가 단계마다 마커를 감춰 핀이 여러 번 깜빡인다.
   */
  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!map || !maps || !focusRequest) return;
    const [top, right, bottom, left] = focusRequest.padding;
    const targetLevel = Math.min(map.getLevel(), MAP_FOCUS_LEVEL);
    // 패딩은 화면 픽셀이고 투영은 지금 배율 기준이다. 도착 배율에서 그만큼 비껴 보이려면
    // 배율 차이의 거듭제곱분의 1만 옮겨야 한다 — 한 단계마다 1픽셀이 담는 거리가 절반으로 준다.
    const shrink = 2 ** (map.getLevel() - targetLevel);
    const projection = map.getProjection();
    const pin = projection.containerPointFromCoords(new maps.LatLng(focusRequest.point.lat, focusRequest.point.lng));
    const center = projection.coordsFromContainerPoint(new maps.Point(pin.x + (right - left) / 2 / shrink, pin.y + (bottom - top) / 2 / shrink));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    map.jump(center, targetLevel, { animate: reducedMotion ? false : { duration: MAP_FOCUS_ANIMATION_MS } });
  }, [map, focusRequest]);

  if (!hasPlace || status === "disabled" || status === "failed") return <div className={className}>{fallback}</div>;

  return (
    <div role={interactive ? "group" : "img"} aria-label={ariaLabel} className={cn("relative bg-surface-tertiary", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {interactive && status === "ready" && map && (
        <div className={cn("absolute right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm", controlsClassName ?? "top-3")} aria-label="지도 배율">
          <button type="button" aria-label="지도 확대" disabled={zoom <= MAP_ZOOM_RANGE.min} onClick={() => map.setLevel(Math.max(MAP_ZOOM_RANGE.min, map.getLevel() - 1))} className="size-11 text-xl font-semibold text-fg-heading hover:bg-surface-secondary focus-visible:bg-surface-tertiary disabled:text-fg-disabled">+</button>
          <button type="button" aria-label="지도 축소" disabled={zoom >= MAP_ZOOM_RANGE.max} onClick={() => map.setLevel(Math.min(MAP_ZOOM_RANGE.max, map.getLevel() + 1))} className="size-11 border-t border-line text-xl font-semibold text-fg-heading hover:bg-surface-secondary focus-visible:bg-surface-tertiary disabled:text-fg-disabled">−</button>
        </div>
      )}
    </div>
  );
}
