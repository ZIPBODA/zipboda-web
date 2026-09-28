"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoPoint } from "@/shared/lib/geo";
import type { MapViewProps } from "@/shared/ui/map";
import type { LoadMapDetail } from "../model/mapDetail";
import { SubscriptionMapDetail } from "./SubscriptionMapDetail";
import { toMapMarkers, type Subscription, type SubscriptionFilterOptions } from "@/entities/subscription";
import { MAP_LEVEL } from "@/shared/config/map";
import { MapFallback, MapViewLoader } from "@/shared/ui/map";
import { MAP_FIT_PADDING, MAP_INITIAL_CENTER, MAP_GEOLOCATION_OPTIONS } from "../config/constants";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";
import { SubscriptionMapToolbar } from "./SubscriptionMapToolbar";
import { SubscriptionMapSidebar } from "./SubscriptionMapSidebar";
import { SubscriptionMapRail } from "./SubscriptionMapRail";

export function SubscriptionMapWorkspace({ items, options, loadDetail }: { items: Subscription[]; options: SubscriptionFilterOptions; loadDetail: LoadMapDetail }) {
  const mapped = useMemo(() => items.filter((item) => item.coord), [items]);
  const markers = useMemo(() => toMapMarkers(mapped), [mapped]);
  const [selectedMapItemIds, setSelectedMapItemIds] = useState<string[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [focusVersion, setFocusVersion] = useState(0);
  const [focusRequest, setFocusRequest] = useState<MapViewProps["focusRequest"]>();
  const workspaceRef = useRef<HTMLElement>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [locationRequest, setLocationRequest] = useState<GeoPoint>();
  const [satellite, setSatellite] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { listHref } = useSubscriptionFilters();
  const selectedItems = mapped.filter((item) => selectedMapItemIds.includes(item.id));
  // 필터에서 제거된 선택은 초기화 뒤에도 되살리지 않는다.
  if (selectedItems.length !== selectedMapItemIds.length) setSelectedMapItemIds(selectedItems.map((item) => item.id));
  if (detailId && !selectedItems.some((item) => item.id === detailId)) setDetailId(null);
  if (listOpen && selectedItems.length === 0) setListOpen(false);
  const focusPoint = mapped.find((item) => item.id === detailId)?.coord;
  const focusLat = focusPoint?.lat;
  const focusLng = focusPoint?.lng;
  useEffect(() => {
    if (!detailId || !listOpen) { setFocusRequest(undefined); return; }
    if (focusLat === undefined || focusLng === undefined) return;
    const frame = requestAnimationFrame(() => {
      const root = workspaceRef.current;
      const canvas = root?.querySelector(".map-workspace-canvas")?.getBoundingClientRect();
      if (!root || !canvas) return;
      let top = 0;
      let bottom = 0;
      let left = 0;
      for (const selector of [".map-workspace-toolbar", '[aria-label="지도 배율"]']) {
        const box = root.querySelector(selector)?.getBoundingClientRect();
        if (box && box.right > canvas.left && box.left < canvas.right) top = Math.max(top, box.bottom - canvas.top);
      }
      const detailNode = root.querySelector('[aria-label="선택한 청약 상세"]');
      const detail = detailNode?.getBoundingClientRect();
      if (detail && detailNode) {
        if (getComputedStyle(detailNode).position === "relative") left = detail.right - canvas.left;
        else bottom = Math.max(0, canvas.bottom - detail.top);
      }
      setFocusRequest({ point: { lat: focusLat, lng: focusLng }, padding: [Math.max(0, top), 0, bottom, Math.max(0, left)] });
    });
    return () => cancelAnimationFrame(frame);
  }, [detailId, listOpen, focusVersion, focusLat, focusLng]);
  const updateVisible = useCallback((ids: string[]) => {
    setVisibleIds((previous) => previous?.join("|") === ids.join("|") ? previous : ids);
  }, []);
  const selectGroup = useCallback((ids: string[]) => { setSelectedMapItemIds([...new Set(ids)]); setListOpen(true); }, []);
  const selectPin = useCallback((id: string) => { setSelectedMapItemIds([id]); setListOpen(true); }, []);
  const closeList = () => { setListOpen(false); setDetailId(null); };
  const closeDetail = () => {
    setDetailId(null);
    requestAnimationFrame(() => {
      const row = Array.from(document.querySelectorAll<HTMLElement>("[data-housing-id]")).find((node) => node.dataset.housingId === detailId);
      row?.querySelector("button")?.focus({ preventScroll: true });
    });
  };
  const locate = () => {
    if (!navigator.geolocation) { setLocationMessage("현재 브라우저에서 위치 확인을 지원하지 않습니다."); return; }
    setLocating(true); setLocationMessage("");
    navigator.geolocation.getCurrentPosition((position) => {
      if (!mounted.current) return;
      setLocationRequest({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocating(false); setLocationMessage("현재 위치로 이동했습니다.");
    }, (error) => {
      if (!mounted.current) return;
      setLocating(false);
      setLocationMessage(error.code === 1 ? "위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 확인해 주세요." : "현재 위치를 확인하지 못했습니다. 다시 시도해 주세요.");
    }, MAP_GEOLOCATION_OPTIONS);
  };
  // 첫 idle 전에는 화면 범위를 모르므로 좌표가 있는 전부를 "보이는 것"으로 친다
  const visibleItemIds = (visibleIds === null ? mapped : mapped.filter((item) => visibleIds.includes(item.id))).map((item) => item.id);
  const visibleCount = visibleItemIds.length;
  const missing = items.length - mapped.length;
  const showsVisibleList = listOpen && selectedMapItemIds.length === visibleItemIds.length && visibleItemIds.every((id) => selectedMapItemIds.includes(id));
  // 지금 화면에 보이는 공고를 목록에 담는다. 이미 그 목록이면 닫는다
  const toggleVisibleList = () => {
    if (showsVisibleList) { closeList(); return; }
    setSelectedMapItemIds(visibleItemIds);
    setDetailId(null);
    setListOpen(true);
  };

  return (
    <main ref={workspaceRef} data-map-workspace className="relative isolate flex min-h-0 flex-1 overflow-hidden" aria-label="공공주택 지도 탐색">
      <div className="map-workspace-canvas absolute inset-0">
        <MapViewLoader markers={markers} clustering initialCenter={MAP_INITIAL_CENTER} level={MAP_LEVEL.list}
          fitPadding={MAP_FIT_PADDING} selectedIds={listOpen ? selectedMapItemIds : []} selectedId={detailId ?? (listOpen && selectedMapItemIds.length === 1 ? selectedMapItemIds[0] : null)}
          focusRequest={focusRequest}
          fitRequest={fitRequest} locationRequest={locationRequest} mapType={satellite ? "hybrid" : "roadmap"}
          onSelect={selectPin} onGroupSelect={selectGroup} onVisibleMarkersChange={updateVisible}
          ariaLabel="공공주택 지도" controlsClassName="map-workspace-zoom top-36" className="absolute inset-0 overflow-hidden"
          fallback={<MapFallback name="공공주택" point={mapped[0]?.coord ?? null} />} />
      </div>
      <div className="map-workspace-panels pointer-events-none absolute inset-0 z-20 flex md:gap-3 md:p-3">
      <h1 className="sr-only">공공주택 지도</h1>
      <SubscriptionMapRail visibleCount={visibleCount} open={listOpen} onToggle={toggleVisibleList} onFit={() => setFitRequest((value) => value + 1)} onLocate={locate} locating={locating} satellite={satellite} onMapType={() => setSatellite((value) => !value)} hasMarkers={mapped.length > 0} />
      {selectedItems.length > 0 && <SubscriptionMapSidebar items={selectedItems} onClose={closeList} activeId={detailId} onDetail={(id) => { setDetailId(id); setFocusVersion((value) => value + 1); }} hidden={!listOpen} detailOpen={!!detailId} />}
      {listOpen && detailId && loadDetail && <SubscriptionMapDetail key={detailId} id={detailId} loadDetail={loadDetail} onClose={closeDetail} />}
      <div className="map-workspace-tools relative min-w-0 flex-1">
        <SubscriptionMapToolbar options={options} />
        {locationMessage && <p role="status" className="absolute left-24 right-16 top-36 z-20 rounded-lg border border-line bg-surface p-3 text-sm md:left-3">{locationMessage}</p>}
        <div className={`absolute bottom-3 left-3 right-16 z-10 w-fit max-w-full rounded-lg border border-line bg-surface p-3 shadow-sm ${listOpen ? "hidden md:block" : ""}`}>
          <p role="status" className="text-xs font-semibold text-fg-heading">{visibleIds === null ? "지도 대상" : "현재 지도"} {visibleCount}건 · 전체 {items.length}건</p>
          <p className="mt-1 text-xs text-fg-muted">{items.length === 0 ? "조건에 맞는 공고가 없습니다. 필터를 변경해 보세요." : visibleCount === 0 ? "이 지도 영역에는 공고가 없습니다. 지도를 이동하거나 축소해 보세요." : "숫자나 핀을 누르면 선택한 청약 목록을 볼 수 있어요."}</p>
          {missing > 0 && <p className="mt-1 text-xs text-fg-muted">좌표가 없는 공고 {missing}건은 <Link href={listHref} className="underline">목록 보기</Link>에서 확인할 수 있습니다.</p>}
        </div>
      </div>
      </div>
    </main>
  );
}
