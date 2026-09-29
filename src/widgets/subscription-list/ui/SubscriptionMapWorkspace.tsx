"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GeoPoint } from "@/shared/lib/geo";
import type { MapViewProps } from "@/shared/ui/map";
import type { LoadMapDetail } from "../model/mapDetail";
import { SubscriptionMapDetail } from "./SubscriptionMapDetail";
import { toMapMarkers, type Subscription, type SubscriptionFilterOptions } from "@/entities/subscription";
import { MAP_LEVEL } from "@/shared/config/map";
import { Button } from "@/shared/ui";
import { MapFallback, MapViewLoader } from "@/shared/ui/map";
import { MAP_INITIAL_CENTER, MAP_GEOLOCATION_OPTIONS } from "../config/constants";
import { measureCoveredInsets, measureFitPadding, type CoveredInsets } from "../lib/measureCoveredInsets";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";
import { useMapOverlayHeights } from "../model/useMapOverlayHeights";
import { useMapPanel } from "../model/useMapPanel";
import { useMapViewportQuery } from "../model/useMapViewportQuery";
import { useCloseOnBack } from "../model/useCloseOnBack";
import { SubscriptionMapToolbar } from "./SubscriptionMapToolbar";
import { SubscriptionMapSidebar } from "./SubscriptionMapSidebar";
import { SubscriptionMapRail } from "./SubscriptionMapRail";

export function SubscriptionMapWorkspace({ items, options, loadDetail }: { items: Subscription[]; options: SubscriptionFilterOptions; loadDetail: LoadMapDetail }) {
  const mapped = useMemo(() => items.filter((item) => item.coord), [items]);
  const markers = useMemo(() => toMapMarkers(mapped), [mapped]);
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const panel = useMapPanel(mapped, visibleIds);
  const { initialViewport, saveViewport } = useMapViewportQuery();
  const [focusVersion, setFocusVersion] = useState(0);
  const [focusRequest, setFocusRequest] = useState<MapViewProps["focusRequest"]>();
  const [fitPadding, setFitPadding] = useState<CoveredInsets>();
  const workspaceRef = useRef<HTMLElement>(null);
  useMapOverlayHeights(workspaceRef);
  const [fitRequest, setFitRequest] = useState(0);
  const [locationRequest, setLocationRequest] = useState<GeoPoint>();
  const [satellite, setSatellite] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { listHref } = useSubscriptionFilters();
  // 첫 맞춤은 지도 SDK가 준비되는 순간 일어난다. 그 전에 패널이 덮은 폭을 재 둬야 공고가 패널 밑에 숨지 않는다
  useLayoutEffect(() => { setFitPadding(measureFitPadding(workspaceRef.current)); }, []);
  const focusPoint = mapped.find((item) => item.id === panel.detailId)?.coord;
  const focusLat = focusPoint?.lat;
  const focusLng = focusPoint?.lng;
  useEffect(() => {
    if (!panel.detailId || !panel.listOpen) { setFocusRequest(undefined); return; }
    if (focusLat === undefined || focusLng === undefined) return;
    const frame = requestAnimationFrame(() => {
      const root = workspaceRef.current;
      if (root) setFocusRequest({ point: { lat: focusLat, lng: focusLng }, padding: measureCoveredInsets(root) });
    });
    return () => cancelAnimationFrame(frame);
  }, [panel.detailId, panel.listOpen, focusVersion, focusLat, focusLng]);
  const updateVisible = useCallback((ids: string[]) => {
    setVisibleIds((previous) => previous?.join("|") === ids.join("|") ? previous : ids);
  }, []);
  const closeDetail = () => {
    const closedId = panel.detailId;
    panel.closeDetail();
    requestAnimationFrame(() => {
      const row = Array.from(document.querySelectorAll<HTMLElement>("[data-housing-id]")).find((node) => node.dataset.housingId === closedId);
      row?.querySelector("button")?.focus({ preventScroll: true });
    });
  };
  useCloseOnBack(panel.detailId !== null, closeDetail);
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
  const visibleCount = panel.visibleItemIds.length;
  const missing = items.length - mapped.length;
  const emptyMessage = items.length === 0
    ? "조건에 맞는 공고가 없습니다. 필터를 변경해 보세요."
    : "이 지도 영역에는 공고가 없습니다. 지도를 이동하거나 축소해 보세요.";
  const missingNote = missing > 0 && <p className="text-xs text-fg-muted">좌표가 없는 공고 {missing}건은 <Link href={listHref} className="underline">목록 보기</Link>에서 확인할 수 있습니다.</p>;

  return (
    <main ref={workspaceRef} data-map-workspace className="relative isolate flex min-h-0 flex-1 overflow-hidden" aria-label="공공주택 지도 탐색">
      {/* 모바일에서는 지도를 접힌 목록 시트 위에서 끝내 카카오 로고와 축척이 시트에 가리지 않게 한다 */}
      <div className="map-workspace-canvas absolute inset-x-0 bottom-16 top-0 md:bottom-0">
        <MapViewLoader markers={markers} clustering initialCenter={MAP_INITIAL_CENTER} initialViewport={initialViewport} level={MAP_LEVEL.list}
          fitPadding={fitPadding} selectedIds={panel.selection ?? []} selectedId={panel.detailId ?? (panel.selection?.length === 1 ? panel.selection[0] : null)}
          focusRequest={focusRequest}
          fitRequest={fitRequest} locationRequest={locationRequest} mapType={satellite ? "hybrid" : "roadmap"} attributionCorner="bottom-right"
          onSelect={(id) => panel.choose([id])} onGroupSelect={panel.choose} onVisibleMarkersChange={updateVisible} onViewportChange={saveViewport}
          ariaLabel="공공주택 지도" controlsClassName="map-workspace-below-toolbar" className="absolute inset-0 overflow-hidden"
          fallback={<MapFallback name="공공주택" point={mapped[0]?.coord ?? null} />} />
      </div>
      <div className="map-workspace-panels pointer-events-none absolute inset-0 z-20 flex p-3 md:gap-3">
      <h1 className="sr-only">공공주택 지도</h1>
      <SubscriptionMapRail onFit={() => { setFitPadding(measureFitPadding(workspaceRef.current)); setFitRequest((value) => value + 1); }} onLocate={locate} locating={locating} satellite={satellite} onMapType={() => setSatellite((value) => !value)} hasMarkers={mapped.length > 0} />
      <SubscriptionMapSidebar items={panel.items} scope={panel.scope} open={panel.listOpen} sheet={panel.sheet} onSheetChange={panel.setSheet}
        onClose={panel.closeList} onShowArea={panel.showArea} activeId={panel.detailId} detailOpen={!!panel.detailId}
        onDetail={(id) => { panel.openDetail(id); setFocusVersion((value) => value + 1); }}
        empty={<p className="px-3 py-5 text-sm text-fg-muted">{emptyMessage}</p>}
        footer={panel.scope === "area" && missingNote && <div className="px-3 py-3">{missingNote}</div>} />
      {panel.listOpen && panel.detailId && loadDetail && <SubscriptionMapDetail key={panel.detailId} id={panel.detailId} item={mapped.find((item) => item.id === panel.detailId)} loadDetail={loadDetail} onClose={closeDetail} />}
      <div className="map-workspace-tools relative min-w-0 flex-1">
        <SubscriptionMapToolbar options={options} />
        {locationMessage && <p role="status" className="map-workspace-message absolute z-20 w-fit rounded-lg border border-line bg-surface p-3 text-sm shadow-sm">{locationMessage}</p>}
        {/* PC에서 목록 패널을 접고 펴는 버튼이다. 숫자는 지금 화면에 보이는 공고 수다. 모바일에서는 시트 손잡이가 이 일을 한다.
            outline 배리언트는 배경이 투명하고 글씨가 브랜드 노랑이라 지도 위에서 읽히지 않아 흰 배경을 덮는다 */}
        <Button size="sm" variant={panel.showsArea ? "primary" : "outline"} disabled={visibleCount === 0 && !panel.showsArea} aria-pressed={panel.showsArea} onClick={panel.toggleArea}
          className={`map-workspace-count absolute bottom-0 left-1/2 z-10 hidden min-h-11 -translate-x-1/2 whitespace-nowrap rounded-full px-6 text-sm font-bold shadow-sm md:inline-flex ${panel.showsArea ? "" : "!bg-surface !text-fg-heading hover:!bg-surface-secondary"}`}>
          청약 {visibleCount}
        </Button>
        {/* 목록 패널을 접었을 때만 지도 위에서 건수와 안내를 대신 보여준다 */}
        <div className={`map-workspace-status absolute bottom-0 left-0 right-16 z-10 w-fit max-w-full rounded-lg border border-line bg-surface p-3 shadow-sm ${panel.listOpen ? "hidden" : "hidden md:block"}`}>
          <p role="status" className="text-xs font-semibold text-fg-heading">{visibleIds === null ? "지도 대상" : "현재 지도"} {visibleCount}건 · 전체 {items.length}건</p>
          <p className="mt-1 text-xs text-fg-muted">{items.length === 0 || visibleCount === 0 ? emptyMessage : "숫자나 핀을 누르면 선택한 청약 목록을 볼 수 있어요."}</p>
          {missingNote && <div className="mt-1">{missingNote}</div>}
        </div>
      </div>
      </div>
    </main>
  );
}
