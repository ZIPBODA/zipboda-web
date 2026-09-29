"use client";

import { Button } from "@/shared/ui";

export function SubscriptionMapRail({ onFit, onLocate, locating, satellite, onMapType, hasMarkers }: {
  onFit: () => void; onLocate: () => void; locating: boolean; satellite: boolean; onMapType: () => void; hasMarkers: boolean;
}) {
  return <nav aria-label="청약 탐색 메뉴" className="map-workspace-rail map-workspace-below-toolbar absolute left-3 z-20 flex flex-row gap-1 rounded-2xl border border-line-subtle bg-surface p-1 shadow-sm md:relative md:right-auto md:flex-col md:left-auto md:top-auto md:z-auto md:w-20 md:shrink-0 md:self-start md:gap-2 md:p-2">
    <Button size="sm" variant="ghost" disabled={!hasMarkers} onClick={onFit} className="min-h-11 flex-1 whitespace-nowrap !px-1 text-xs md:flex-none">전체 위치</Button>
    <Button size="sm" variant="ghost" disabled={locating} onClick={onLocate} className="min-h-11 flex-1 whitespace-nowrap !px-1 text-xs md:flex-none">{locating ? "위치 확인 중" : "내 위치"}</Button>
    <Button size="sm" variant="ghost" aria-label="위성지도" aria-pressed={satellite} onClick={onMapType} className="min-h-11 flex-1 whitespace-nowrap !px-1 text-xs md:flex-none">{satellite ? "일반지도" : "위성지도"}</Button>
  </nav>;
}
