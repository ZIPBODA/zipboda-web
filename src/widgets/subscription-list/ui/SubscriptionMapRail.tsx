"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/shared/ui";

/**
 * 모바일에서는 오른쪽 배율 버튼과 짝을 이루는 왼쪽 세로 아이콘 열이고, PC에서는 패널 옆 글자 메뉴다.
 * 글자는 모바일에서 화면에만 숨겨 버튼 이름으로 남긴다.
 */
function RailButton({ icon, children, ...props }: { icon: ReactNode; children: ReactNode } & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Button size="sm" variant="ghost" {...props}
      className="min-h-11 whitespace-nowrap !px-1 text-xs max-md:size-11 max-md:rounded-none max-md:border-t max-md:border-line max-md:!p-0 max-md:first:border-t-0 md:flex-none">
      <span aria-hidden className="md:hidden">{icon}</span>
      <span className="max-md:sr-only">{children}</span>
    </Button>
  );
}

export function SubscriptionMapRail({ onFit, onLocate, locating, satellite, onMapType, hasMarkers }: {
  onFit: () => void; onLocate: () => void; locating: boolean; satellite: boolean; onMapType: () => void; hasMarkers: boolean;
}) {
  return <nav aria-label="청약 탐색 메뉴" className="map-workspace-rail map-workspace-below-toolbar absolute left-3 z-20 flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm md:relative md:left-auto md:top-auto md:z-auto md:w-20 md:shrink-0 md:self-start md:gap-2 md:overflow-visible md:rounded-2xl md:border-line-subtle md:p-2">
    <RailButton icon={<FitIcon />} disabled={!hasMarkers} onClick={onFit}>전체 위치</RailButton>
    <RailButton icon={<LocateIcon />} disabled={locating} onClick={onLocate}>{locating ? "위치 확인 중" : "내 위치"}</RailButton>
    <RailButton icon={<LayersIcon />} aria-label="위성지도" aria-pressed={satellite} onClick={onMapType}>{satellite ? "일반지도" : "위성지도"}</RailButton>
  </nav>;
}

function FitIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}
