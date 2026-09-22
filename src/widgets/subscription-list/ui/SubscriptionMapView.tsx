"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const updateVisible = useCallback((ids: string[]) => {
    setVisibleIds((previous) => previous?.join("|") === ids.join("|") ? previous : ids);
  }, []);

  // 고르지 않았으면 카드도 없다. 아무것도 누르지 않았는데 첫 공고가 골라져 있으면 무엇을 보고 있는지 흐려진다
  const selected = mapped.find((item) => item.id === selectedId) ?? null;
  const missing = items.length - mapped.length;

  // 필터가 바뀌어 고른 공고가 결과에서 빠지면 선택도 함께 놓는다
  useEffect(() => {
    if (selectedId !== null && !mapped.some((item) => item.id === selectedId)) setSelectedId(null);
  }, [mapped, selectedId]);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm font-semibold text-fg-heading">
          {visibleIds === null ? `지도 대상 ${mapped.length}건` : `현재 지도 ${mapped.filter((item) => visibleIds.includes(item.id)).length}건 · 전체 ${mapped.length}건`}
        </p>
        <p className="text-xs text-fg-muted">숫자를 누르면 확대하고, 끝까지 확대하면 핀 하나가 공고 하나예요.</p>
      </div>
      <MapViewLoader
        markers={markers}
        clustering
        level={MAP_LEVEL.list}
        selectedId={selected?.id ?? null}
        onSelect={setSelectedId}
        onVisibleMarkersChange={updateVisible}
        ariaLabel="청약 공고 지도"
        fallback={<MapFallback name={selected?.title ?? "청약 공고"} point={selected?.coord ?? null} />}
        className={`overflow-hidden rounded-xl border border-line-subtle ${MAP_VIEW_HEIGHT.mobile} ${MAP_VIEW_HEIGHT.desktop}`}
      />

      {selected ? (
        <>
          <div className="hidden md:block">
            <SubscriptionCard item={selected} />
          </div>
          <div className="md:hidden">
            <SubscriptionCardMobile item={selected} />
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-line-subtle bg-surface-secondary px-4 py-5 text-center text-sm text-fg-muted">
          지도를 확대해 핀을 누르면 공고를 볼 수 있습니다.
        </p>
      )}

      {missing > 0 && <p className="text-2xsmall text-fg-muted">좌표가 없어 지도에 올리지 못한 공고 {missing}건은 목록 보기에서 확인할 수 있습니다.</p>}
    </div>
  );
}
