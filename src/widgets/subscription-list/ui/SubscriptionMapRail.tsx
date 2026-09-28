"use client";

import { Button } from "@/shared/ui";

export function SubscriptionMapRail({ hasSelection, open, onToggle, onFit, onLocate, locating, satellite, onMapType, hasMarkers }: {
  hasSelection: boolean; open: boolean; onToggle: () => void; onFit: () => void; onLocate: () => void;
  locating: boolean; satellite: boolean; onMapType: () => void; hasMarkers: boolean;
}) {
  return <nav aria-label="청약 탐색 메뉴" className="absolute left-3 right-16 top-36 z-20 flex flex-row gap-1 rounded-2xl border border-line-subtle bg-surface p-1 shadow-sm md:relative md:right-auto md:flex-col md:left-auto md:top-auto md:z-auto md:w-20 md:shrink-0 md:self-start md:gap-2 md:p-2">
    <Button size="sm" variant={open ? "primary" : "ghost"} disabled={!hasSelection} aria-expanded={open} onClick={onToggle} className="min-h-11 flex-1 whitespace-nowrap !px-1 text-xs md:flex-none">선택 목록</Button>
    <Button size="sm" variant="ghost" disabled={!hasMarkers} onClick={onFit} className="min-h-11 flex-1 whitespace-nowrap !px-1 text-xs md:flex-none">전체 위치</Button>
    <Button size="sm" variant="ghost" disabled={locating} onClick={onLocate} className="min-h-11 flex-1 whitespace-nowrap !px-1 text-xs md:flex-none">{locating ? "위치 확인 중" : "내 위치"}</Button>
    <Button size="sm" variant="ghost" aria-label="위성지도" aria-pressed={satellite} onClick={onMapType} className="min-h-11 flex-1 whitespace-nowrap !px-1 text-xs md:flex-none">{satellite ? "일반지도" : "위성지도"}</Button>
  </nav>;
}
