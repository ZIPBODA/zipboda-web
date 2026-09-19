"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAP_LEVEL, MAP_SINGLE_MARKER_LEVEL } from "../../config/map";
import { boundsOf } from "../../lib/geo";
import { loadKakaoMaps, type MapSdkStatus } from "../../lib/kakaoMapLoader";
import { cn } from "../cn";
import type { MapViewProps } from "./types";

/**
 * window.kakao를 만지는 유일한 컴포넌트.
 * 지도 인스턴스와 마커는 React 트리 밖에서 ref로 관리한다 — 마커가 수백 개가 되어도 재생성 비용이 들지 않게.
 */
export function KakaoMapView({
  markers,
  center = null,
  level = MAP_LEVEL.detail,
  interactive = true,
  selectedId = null,
  onSelect,
  fallback = null,
  className,
  ariaLabel = "지도"
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef(new Map<string, kakao.maps.Marker>());
  const [status, setStatus] = useState<MapSdkStatus | "loading">("loading");

  const hasPlace = markers.length > 0 || center !== null;

  useEffect(() => {
    if (!hasPlace) return;
    let cancelled = false;
    const placed = markerRef.current;

    void loadKakaoMaps().then((result) => {
      if (cancelled) return;
      setStatus(result.status);
      if (result.status !== "ready" || !result.maps || !containerRef.current) return;

      const maps = result.maps;
      const origin = center ?? markers[0]?.point ?? null;
      if (!origin) return;

      mapRef.current = new maps.Map(containerRef.current, {
        center: new maps.LatLng(origin.lat, origin.lng),
        level,
        draggable: interactive,
        scrollwheel: interactive,
        disableDoubleClickZoom: !interactive
      });
    });

    return () => {
      cancelled = true;
      placed.forEach((marker) => marker.setMap(null));
      placed.clear();
      mapRef.current = null;
    };
    // 지도 인스턴스는 한 번만 만든다. 이후 변화는 아래 effect들이 반영한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPlace]);

  // 마커는 지우고 다시 만들지 않고 id 기준으로 맞춰 나간다
  useEffect(() => {
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;

    const next = new Set(markers.map((marker) => marker.id));
    markerRef.current.forEach((marker, id) => {
      if (next.has(id)) return;
      marker.setMap(null);
      markerRef.current.delete(id);
    });

    for (const item of markers) {
      const existing = markerRef.current.get(item.id);
      if (existing) {
        existing.setPosition(new maps.LatLng(item.point.lat, item.point.lng));
        continue;
      }
      const marker = new maps.Marker({
        position: new maps.LatLng(item.point.lat, item.point.lng),
        title: item.label,
        clickable: onSelect !== undefined
      });
      marker.setMap(map);
      if (onSelect) maps.event.addListener(marker, "click", () => onSelect(item.id));
      markerRef.current.set(item.id, marker);
    }
  }, [markers, onSelect, status]);

  /**
   * 화면을 마커에 맞춘다. center를 직접 받은 경우는 그 위치를 지킨다.
   * 크기가 바뀔 때도 같은 규칙을 다시 쓴다 — 첫 마커로만 중심을 잡으면 나머지 마커가 화면 밖으로 밀린다.
   */
  const frame = useCallback((map: kakao.maps.Map) => {
    const maps = window.kakao?.maps;
    if (!maps) return;

    if (center) {
      map.setCenter(new maps.LatLng(center.lat, center.lng));
      return;
    }
    const bounds = boundsOf(markers.map((marker) => marker.point));
    if (!bounds) return;
    if (markers.length === 1) {
      map.setCenter(new maps.LatLng(bounds.south, bounds.west));
      map.setLevel(MAP_SINGLE_MARKER_LEVEL);
      return;
    }
    map.setBounds(new maps.LatLngBounds(new maps.LatLng(bounds.south, bounds.west), new maps.LatLng(bounds.north, bounds.east)));
  }, [center, markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) frame(map);
  }, [frame, status]);

  // 선택된 마커를 앞으로 올린다
  useEffect(() => {
    markerRef.current.forEach((marker, id) => marker.setZIndex(id === selectedId ? 1 : 0));
  }, [selectedId, status]);

  /**
   * 상세 화면은 PC 트리와 모바일 트리를 함께 그리고 한쪽을 CSS로 감춘다.
   * 감춰진 쪽은 크기가 0이라 지도가 0으로 자리를 잡고, 화면 폭이 바뀌어 보이게 돼도 회색으로 남는다.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || status !== "ready") return;

    const observer = new ResizeObserver(() => {
      const map = mapRef.current;
      if (!map || container.clientWidth === 0) return;
      map.relayout();
      frame(map);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [status, frame]);

  if (!hasPlace || status === "disabled" || status === "failed") {
    return <div className={className}>{fallback}</div>;
  }

  return <div ref={containerRef} aria-label={ariaLabel} role="img" className={cn("bg-surface-tertiary", className)} />;
}
