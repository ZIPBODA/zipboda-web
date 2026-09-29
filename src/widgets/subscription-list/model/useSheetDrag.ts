import { useRef, useState, type PointerEvent, type RefObject } from "react";
import { MAP_SHEET_LONG_DRAG_RATIO, MAP_SHEET_SNAPS, MAP_SHEET_TAP_SLOP_PX } from "../config/constants";

export type MapSheetSnap = (typeof MAP_SHEET_SNAPS)[number];

const clamp = (min: number, value: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * 모바일 목록 시트의 손잡이. 누르면 접힘과 반 높이를 오가고, 끄는 동안에는 손가락 높이를 따라가다 놓는 순간 다음 단계에 붙는다.
 * 길게 끌면 한 단계를 건너뛴다 — 접힌 시트를 한 번에 툴바 아래까지 올릴 수 있게.
 */
export function useSheetDrag(sheetRef: RefObject<HTMLElement>, snap: MapSheetSnap, onSnap: (next: MapSheetSnap) => void) {
  const drag = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const [height, setHeight] = useState<number | null>(null);
  const room = () => sheetRef.current?.parentElement?.clientHeight ?? 0;

  const finish = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    drag.current = null;
    if (!current?.moved) return;
    justDragged.current = true;
    setHeight(null);
    const lift = current.startY - event.clientY;
    const steps = Math.abs(lift) > room() * MAP_SHEET_LONG_DRAG_RATIO ? 2 : 1;
    const index = clamp(0, MAP_SHEET_SNAPS.indexOf(snap) + Math.sign(lift) * steps, MAP_SHEET_SNAPS.length - 1);
    onSnap(MAP_SHEET_SNAPS[index]);
  };

  return {
    height,
    handle: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        const sheet = sheetRef.current;
        if (!sheet) return;
        drag.current = { startY: event.clientY, startHeight: sheet.getBoundingClientRect().height, moved: false };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const current = drag.current;
        if (!current) return;
        const lift = current.startY - event.clientY;
        if (!current.moved && Math.abs(lift) < MAP_SHEET_TAP_SLOP_PX) return;
        current.moved = true;
        setHeight(clamp(0, current.startHeight + lift, room()));
      },
      onPointerUp: finish,
      onPointerCancel() {
        drag.current = null;
        setHeight(null);
      },
      onClick() {
        // 끌기를 마친 손가락이 떨어질 때도 click이 온다. 그 click은 누름이 아니다
        if (justDragged.current) {
          justDragged.current = false;
          return;
        }
        onSnap(snap === "peek" ? "half" : "peek");
      }
    }
  };
}
