"use client";

import { useMemo, useState } from "react";
import { SubscriptionCard, SubscriptionCardMobile, toMapMarkers, type Subscription } from "@/entities/subscription";
import { MAP_LEVEL } from "@/shared/config/map";
import { MapFallback, MapViewLoader } from "@/shared/ui/map";
import { MAP_VIEW_HEIGHT } from "../config/constants";

/**
 * 마커 선택은 URL에 넣지 않는다 — 클릭마다 히스토리가 쌓이고 서버 리렌더로 지도가 처음 위치로 튄다.
 * 딥링크가 필요해지면 이 상태만 위로 올리면 된다.
 */
export function SubscriptionMapView({ items }: { items: Subscription[] }) {
  const mapped = useMemo(() => items.filter((item) => item.coord), [items]);
  const markers = useMemo(() => toMapMarkers(mapped), [mapped]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = mapped.find((item) => item.id === selectedId) ?? mapped[0] ?? null;
  const missing = items.length - mapped.length;

  if (mapped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line-subtle bg-surface-secondary py-20 text-center">
        <p className="text-base font-semibold text-fg-body">지도에 표시할 공고가 없습니다</p>
        <p className="text-sm text-fg-muted">
          {items.length === 0 ? "필터를 변경해 다시 검색해 보세요." : "좌표를 확인하지 못한 공고입니다. 목록 보기에서 볼 수 있습니다."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <MapViewLoader
        markers={markers}
        level={MAP_LEVEL.list}
        selectedId={selected?.id ?? null}
        onSelect={setSelectedId}
        ariaLabel="청약 공고 지도"
        fallback={<MapFallback name={selected?.title ?? "청약 공고"} point={selected?.coord ?? null} />}
        className={`overflow-hidden rounded-xl border border-line-subtle ${MAP_VIEW_HEIGHT.mobile} ${MAP_VIEW_HEIGHT.desktop}`}
      />

      {selected && (
        <>
          <div className="hidden md:block">
            <SubscriptionCard item={selected} />
          </div>
          <div className="md:hidden">
            <SubscriptionCardMobile item={selected} />
          </div>
        </>
      )}

      {missing > 0 && <p className="text-2xsmall text-fg-muted">좌표가 없어 지도에 올리지 못한 공고 {missing}건은 목록 보기에서 확인할 수 있습니다.</p>}
    </div>
  );
}
