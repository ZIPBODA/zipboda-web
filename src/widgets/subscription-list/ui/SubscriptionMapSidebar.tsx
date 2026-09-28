"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_SORT, SORT_OPTIONS, type Subscription } from "@/entities/subscription";
import { Button } from "@/shared/ui";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";
import { SubscriptionMapResultCard } from "./SubscriptionMapResultCard";

export function SubscriptionMapSidebar({ items, onClose, activeId, onDetail, hidden = false, detailOpen = false }: { items: Subscription[]; onClose: () => void; activeId?: string | null; onDetail: (id: string) => void; hidden?: boolean; detailOpen?: boolean }) {
  const { params, update } = useSubscriptionFilters();
  const listRef = useRef<HTMLDivElement>(null);
  const selectionKey = items.map((item) => item.id).join("|");
  useEffect(() => { listRef.current?.scrollTo?.({ top: 0 }); }, [selectionKey]);

  return (
    <aside hidden={hidden} aria-label="선택한 청약 목록" className={`${hidden ? "!hidden" : detailOpen ? "hidden xl:flex" : "flex"} absolute inset-x-3 bottom-3 z-30 h-1/2 flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-sm md:relative md:inset-auto md:z-auto md:h-auto md:w-80 md:shrink-0`}>
      <div className="shrink-0 border-b border-line-subtle px-5 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-fg-heading">청약 목록</h2>
          <Button type="button" size="sm" variant="ghost" aria-label="청약 목록 닫기" onClick={onClose} className="min-h-11 min-w-11"><span aria-hidden className="text-xl">×</span></Button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p role="status" className="text-sm font-semibold text-fg-heading">선택한 청약 {items.length}건</p>
          <select aria-label="결과 정렬" value={params.get("sort") ?? DEFAULT_SORT} onChange={(event) => update("sort", event.target.value, event.target.value === DEFAULT_SORT)} className="h-11 rounded-lg border border-line bg-surface px-2 text-xs text-fg-body">
            {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3" aria-label="선택한 청약 결과">
        {items.map((item) => <SubscriptionMapResultCard key={item.id} item={item} active={activeId === item.id} onSelect={() => onDetail(item.id)} />)}
      </div>
    </aside>
  );
}
