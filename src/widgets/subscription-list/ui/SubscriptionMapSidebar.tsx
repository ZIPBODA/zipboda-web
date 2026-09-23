"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_SORT, SORT_OPTIONS, type Subscription } from "@/entities/subscription";
import { Button } from "@/shared/ui";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";
import { SubscriptionMapResultCard } from "./SubscriptionMapResultCard";

export function SubscriptionMapSidebar({ items, onClose }: { items: Subscription[]; onClose: () => void }) {
  const { params, update } = useSubscriptionFilters();
  const listRef = useRef<HTMLDivElement>(null);
  const selectionKey = items.map((item) => item.id).join("|");
  useEffect(() => { listRef.current?.scrollTo?.({ top: 0 }); }, [selectionKey]);

  return (
    <aside aria-label="선택한 청약 목록" className="absolute inset-x-0 bottom-0 z-30 flex h-1/2 flex-col overflow-hidden rounded-t-xl border-t border-line bg-surface shadow-sm md:relative md:inset-auto md:z-auto md:h-full md:w-96 md:shrink-0 md:rounded-none md:border-r md:border-t-0 md:shadow-none">
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
      <div ref={listRef} className="min-h-0 flex-1 divide-y divide-line-subtle overflow-y-auto overscroll-contain" aria-label="선택한 청약 결과">
        {items.map((item) => <SubscriptionMapResultCard key={item.id} item={item} />)}
      </div>
    </aside>
  );
}
