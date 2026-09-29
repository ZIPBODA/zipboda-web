"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { DEFAULT_SORT, SORT_OPTIONS, type Subscription } from "@/entities/subscription";
import { Button, cn } from "@/shared/ui";
import { useSubscriptionFilters } from "../model/useSubscriptionFilters";
import { useSheetDrag, type MapSheetSnap } from "../model/useSheetDrag";
import { SubscriptionMapResultCard } from "./SubscriptionMapResultCard";

interface Props {
  items: Subscription[];
  /** area: 지금 지도에 보이는 공고, selection: 배지·핀으로 고른 공고 */
  scope: "area" | "selection";
  /** PC 패널이 펼쳐져 있는지. 모바일 시트는 접혀도 손잡이가 남는다 */
  open: boolean;
  sheet: MapSheetSnap;
  onSheetChange: (next: MapSheetSnap) => void;
  onClose: () => void;
  onShowArea: () => void;
  activeId: string | null;
  onDetail: (id: string) => void;
  detailOpen: boolean;
  empty: ReactNode;
  footer?: ReactNode;
}

const SHEET_HEIGHT_CLASS: Record<MapSheetSnap, string> = { peek: "max-md:h-16", half: "max-md:h-1/2", full: "max-md:map-sheet-full" };

function panelDisplay(open: boolean, detailOpen: boolean) {
  // 모바일 시트는 늘 떠 있다가 상세가 열리면 그 자리를 내준다. PC 패널은 닫기 버튼으로 접힌다
  if (detailOpen) return open ? "hidden xl:flex" : "hidden";
  return open ? "flex" : "flex md:hidden";
}

export function SubscriptionMapSidebar({ items, scope, open, sheet, onSheetChange, onClose, onShowArea, activeId, onDetail, detailOpen, empty, footer }: Props) {
  const { params, update } = useSubscriptionFilters();
  const sheetRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { height, handle } = useSheetDrag(sheetRef, sheet, onSheetChange);
  const selectionKey = items.map((item) => item.id).join("|");
  useEffect(() => { listRef.current?.scrollTo?.({ top: 0 }); }, [selectionKey]);
  // 접힌 시트에서는 손잡이 아래가 화면에 없다. 보이지 않는 카드로 초점이 들어가지 않게 숨긴다
  const collapsed = sheet === "peek" && "max-md:invisible";

  return (
    <aside ref={sheetRef} aria-label="청약 목록" data-open={open} data-sheet={sheet} style={height === null ? undefined : { height }}
      className={cn(panelDisplay(open, detailOpen), "absolute inset-x-0 bottom-0 z-30 flex-col overflow-hidden rounded-t-2xl border-t border-line-subtle bg-surface shadow-sm md:relative md:inset-auto md:z-auto md:h-auto md:w-80 md:shrink-0 md:rounded-2xl md:border", height === null && SHEET_HEIGHT_CLASS[sheet])}>
      <div className="relative shrink-0 border-b border-line-subtle px-5 pb-3 pt-2 md:pt-3">
        <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-line-strong md:hidden" />
        <div className="flex min-h-11 items-center gap-2">
          <h2 className="text-lg font-bold text-fg-heading">청약 목록</h2>
          <p role="status" className="text-sm font-semibold text-fg-muted">{scope === "area" ? "이 지역" : "선택"} {items.length}건</p>
          <span aria-hidden className="ml-auto text-xs text-fg-muted md:hidden">{sheet === "peek" ? "▲" : "▼"}</span>
          <Button type="button" size="sm" variant="ghost" aria-label="청약 목록 닫기" onClick={onClose} className="ml-auto hidden min-h-11 min-w-11 md:inline-flex"><span aria-hidden className="text-xl">×</span></Button>
        </div>
        {/* 모바일 손잡이. 제목 줄 전체를 덮어 누르기·끌기 영역을 넓힌다 */}
        <button type="button" aria-expanded={sheet !== "peek"} aria-label={sheet === "peek" ? "청약 목록 펼치기" : "청약 목록 접기"} className="absolute inset-x-0 top-0 h-16 touch-none md:hidden" {...handle} />
        <div className={cn("mt-2 flex items-center justify-between gap-2", collapsed)}>
          {scope === "selection" ? <Button type="button" size="sm" variant="ghost" onClick={onShowArea} className="min-h-11 !px-2">← 지도 영역 전체 보기</Button> : <span />}
          <select aria-label="결과 정렬" value={params.get("sort") ?? DEFAULT_SORT} onChange={(event) => update("sort", event.target.value, event.target.value === DEFAULT_SORT)} className="h-11 rounded-lg border border-line bg-surface px-2 text-xs font-semibold text-fg-body">
            {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>
      <div ref={listRef} className={cn("min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-2", collapsed)} aria-label="청약 결과">
        {items.length > 0 ? items.map((item) => <SubscriptionMapResultCard key={item.id} item={item} active={activeId === item.id} onSelect={() => onDetail(item.id)} />) : empty}
        {footer}
      </div>
    </aside>
  );
}
