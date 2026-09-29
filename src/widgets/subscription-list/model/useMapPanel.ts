import { useState } from "react";
import type { Subscription } from "@/entities/subscription";
import type { MapSheetSnap } from "./useSheetDrag";

/**
 * 지도 옆 목록이 무엇을 보여주는지.
 * 기본은 지금 지도에 보이는 공고(area)이고 지도를 움직이면 따라 바뀐다. 배지·핀을 누르면 그 공고로 좁힌다(selection).
 * 공고 상세를 연 동안에는 목록을 멈춘다 — 상세로 날아가며 확대되면 옆 카드가 줄줄이 사라지기 때문이다.
 */
export function useMapPanel(mapped: Subscription[], visibleIds: string[] | null) {
  const [selection, setSelection] = useState<string[] | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [sheet, setSheet] = useState<MapSheetSnap>("peek");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [frozenAreaIds, setFrozenAreaIds] = useState<string[] | null>(null);

  // 첫 idle 전에는 화면 범위를 모르므로 좌표가 있는 전부를 "보이는 것"으로 친다
  const visibleItemIds = (visibleIds === null ? mapped : mapped.filter((item) => visibleIds.includes(item.id))).map((item) => item.id);
  const panelIds = selection ?? frozenAreaIds ?? visibleItemIds;
  const items = mapped.filter((item) => panelIds.includes(item.id));

  // 필터에서 빠진 선택은 되살리지 않는다. 모두 빠지면 지도 영역 목록으로 돌아간다
  if (selection !== null) {
    const kept = selection.filter((id) => mapped.some((item) => item.id === id));
    if (kept.length !== selection.length) setSelection(kept.length > 0 ? kept : null);
  }
  if (detailId && !items.some((item) => item.id === detailId)) setDetailId(null);

  const showArea = () => {
    setSelection(null);
    setDetailId(null);
    setFrozenAreaIds(null);
    setListOpen(true);
  };
  const closeList = () => {
    setListOpen(false);
    setSelection(null);
    setDetailId(null);
    setFrozenAreaIds(null);
  };
  const showsArea = listOpen && selection === null;

  return {
    scope: selection === null ? "area" as const : "selection" as const,
    items,
    selection,
    visibleItemIds,
    listOpen,
    showsArea,
    sheet,
    detailId,
    setSheet,
    showArea,
    closeList,
    choose(ids: string[]) {
      setSelection([...new Set(ids)]);
      setDetailId(null);
      setFrozenAreaIds(null);
      setListOpen(true);
      setSheet((current) => (current === "peek" ? "half" : current));
    },
    /** '청약 N' 버튼 — 지도 영역 목록이 이미 열려 있으면 접고, 아니면 연다 */
    toggleArea() {
      if (showsArea) closeList();
      else showArea();
    },
    openDetail(id: string) {
      if (selection === null) setFrozenAreaIds(frozenAreaIds ?? visibleItemIds);
      setDetailId(id);
      // PC에서 패널을 접은 채 모바일 폭으로 줄면 시트에서 카드를 눌러도 상세가 뜨지 않는다
      setListOpen(true);
    },
    closeDetail() {
      setDetailId(null);
      setFrozenAreaIds(null);
    }
  };
}
