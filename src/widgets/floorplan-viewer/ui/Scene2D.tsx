"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { SCENE2D_ZOOM } from "../config/constants";
import { clampOffset } from "../lib/clampOffset";
import { zoomAtPoint, type PanOffset, type ZoomState } from "../lib/zoomAtPoint";

const FIT: ZoomState = { scale: SCENE2D_ZOOM.fit, offset: { x: 0, y: 0 } };

// figma 353:3980 2D 평면도 — LH/SH 도면 PNG 팬/줌 뷰
export function Scene2D({ src, alt }: { src: string; alt: string }) {
  const [view, setView] = useState(FIT);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const sizeOf = () => {
    const box = frameRef.current?.getBoundingClientRect();
    return { width: box?.width ?? 0, height: box?.height ?? 0 };
  };

  /** 컨테이너 중심을 원점으로 본 포인터 위치 — 앵커 줌은 이 기준으로 계산한다 */
  const pointerFromCenter = (clientX: number, clientY: number) => {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return { x: clientX - (box.left + box.width / 2), y: clientY - (box.top + box.height / 2) };
  };

  const applyZoom = (factor: number, pointer: { x: number; y: number }) =>
    setView((current) => {
      const next = zoomAtPoint(current, pointer, factor);
      return { scale: next.scale, offset: clampOffset(next.offset, sizeOf(), next.scale) };
    });

  const panTo = (offset: PanOffset) => setView((current) => ({ ...current, offset: clampOffset(offset, sizeOf(), current.scale) }));

  const zoomed = view.scale > SCENE2D_ZOOM.fit;

  return (
    <div className="relative flex-1 overflow-hidden bg-surface-secondary">
      <div
        ref={frameRef}
        className="absolute inset-0 touch-none"
        onWheel={(e) => applyZoom(e.deltaY < 0 ? SCENE2D_ZOOM.factor : 1 / SCENE2D_ZOOM.factor, pointerFromCenter(e.clientX, e.clientY))}
        onDoubleClick={(e) => applyZoom(SCENE2D_ZOOM.factor, pointerFromCenter(e.clientX, e.clientY))}
        onPointerDown={(e) => {
          if (!zoomed) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: view.offset.x, oy: view.offset.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          panTo({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="absolute inset-0 transition-transform duration-75"
          style={{ transform: `translate(${view.offset.x}px, ${view.offset.y}px) scale(${view.scale})`, cursor: zoomed ? "grab" : "default" }}
        >
          {/* fill 이미지는 조상의 패딩 박스를 기준으로 펼쳐지므로, 여백을 주려면 흐름 박스를 한 겹 끼워야 한다 */}
          <div className="absolute inset-0 p-6 md:p-10">
            <div className="relative h-full w-full">
              <Image src={src} alt={alt} fill priority sizes="100vw" className="object-contain" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <ZoomButton label="확대" onClick={() => applyZoom(SCENE2D_ZOOM.factor, { x: 0, y: 0 })} disabled={view.scale >= SCENE2D_ZOOM.max}>
          +
        </ZoomButton>
        <ZoomButton label="축소" onClick={() => applyZoom(1 / SCENE2D_ZOOM.factor, { x: 0, y: 0 })} disabled={view.scale <= SCENE2D_ZOOM.min}>
          −
        </ZoomButton>
        <ZoomButton label="원래대로" onClick={() => setView(FIT)} disabled={!zoomed && view.offset.x === 0 && view.offset.y === 0}>
          ⤢
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-lg font-bold text-fg-body shadow-sm disabled:opacity-40"
    >
      {children}
    </button>
  );
}
