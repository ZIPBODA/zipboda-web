"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toMapMarkers, type Subscription, type SubscriptionFilterOptions } from "@/entities/subscription";
import { MAP_LEVEL } from "@/shared/config/map";
import { MapFallback, MapViewLoader } from "@/shared/ui/map";
import { MAP_FIT_PADDING, MAP_INITIAL_CENTER } from "../config/constants";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";
import { SubscriptionMapToolbar } from "./SubscriptionMapToolbar";
import { SubscriptionMapSidebar } from "./SubscriptionMapSidebar";
import { SubscriptionMapRail } from "./SubscriptionMapRail";

export function SubscriptionMapWorkspace({ items, options }: { items: Subscription[]; options: SubscriptionFilterOptions }) {
  const mapped = useMemo(() => items.filter((item) => item.coord), [items]);
  const markers = useMemo(() => toMapMarkers(mapped), [mapped]);
  const [selectedMapItemIds, setSelectedMapItemIds] = useState<string[]>([]);
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const { listHref } = useSubscriptionFilters();
  const selectedItems = mapped.filter((item) => selectedMapItemIds.includes(item.id));
  // 필터에서 제거된 선택은 초기화 뒤에도 되살리지 않는다.
  if (selectedItems.length !== selectedMapItemIds.length) setSelectedMapItemIds(selectedItems.map((item) => item.id));
  const updateVisible = useCallback((ids: string[]) => {
    setVisibleIds((previous) => previous?.join("|") === ids.join("|") ? previous : ids);
  }, []);
  const selectGroup = useCallback((ids: string[]) => setSelectedMapItemIds([...new Set(ids)]), []);
  const selectPin = useCallback((id: string) => setSelectedMapItemIds([id]), []);
  const visibleCount = visibleIds === null ? mapped.length : mapped.filter((item) => visibleIds.includes(item.id)).length;
  const missing = items.length - mapped.length;

  return (
    <main data-map-workspace className="relative isolate flex min-h-0 flex-1 overflow-hidden" aria-label="공공주택 지도 탐색">
      <h1 className="sr-only">공공주택 지도</h1>
      <SubscriptionMapRail />
      {selectedItems.length > 0 && <SubscriptionMapSidebar items={selectedItems} onClose={() => setSelectedMapItemIds([])} />}
      <div className="relative min-w-0 flex-1">
        <MapViewLoader markers={markers} clustering initialCenter={MAP_INITIAL_CENTER} level={MAP_LEVEL.list}
          fitPadding={MAP_FIT_PADDING} selectedIds={selectedMapItemIds} selectedId={selectedMapItemIds.length === 1 ? selectedMapItemIds[0] : null}
          onSelect={selectPin} onGroupSelect={selectGroup} onVisibleMarkersChange={updateVisible}
          ariaLabel="공공주택 지도" controlsClassName="top-36 xl:top-20" className="absolute inset-0 overflow-hidden"
          fallback={<MapFallback name="공공주택" point={mapped[0]?.coord ?? null} />} />
        <SubscriptionMapToolbar options={options} />
        <div className={`absolute bottom-3 left-3 right-16 z-10 w-fit max-w-full rounded-lg border border-line bg-surface p-3 shadow-sm ${selectedItems.length ? "hidden md:block" : ""}`}>
          <p role="status" className="text-xs font-semibold text-fg-heading">{visibleIds === null ? "지도 대상" : "현재 지도"} {visibleCount}건 · 전체 {items.length}건</p>
          <p className="mt-1 text-xs text-fg-muted">{items.length === 0 ? "조건에 맞는 공고가 없습니다. 필터를 변경해 보세요." : visibleCount === 0 ? "이 지도 영역에는 공고가 없습니다. 지도를 이동하거나 축소해 보세요." : "숫자나 핀을 누르면 선택한 청약 목록을 볼 수 있어요."}</p>
          {missing > 0 && <p className="mt-1 text-xs text-fg-muted">좌표가 없는 공고 {missing}건은 <Link href={listHref} className="underline">목록 보기</Link>에서 확인할 수 있습니다.</p>}
        </div>
      </div>
    </main>
  );
}
