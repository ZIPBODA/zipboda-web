"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.4;

// figma 353:3980 2D 평면도 — LH/SH 도면 PNG 팬/줌 뷰
export function Scene2D({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
  const zoomBy = (delta: number) => setScale((s) => clampScale(s + delta));
  const reset = () => {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-surface-secondary">
      <div
        className="absolute inset-0 touch-none"
        onWheel={(e) => zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)}
        onPointerDown={(e) => {
          if (scale === MIN_SCALE) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setOffset({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, cursor: scale > MIN_SCALE ? "grab" : "default" }}
        >
          <div className="relative h-full w-full">
            <Image src={src} alt={alt} fill priority sizes="100vw" className="object-contain" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <ZoomButton label="확대" onClick={() => zoomBy(ZOOM_STEP)} disabled={scale >= MAX_SCALE}>
          +
        </ZoomButton>
        <ZoomButton label="축소" onClick={() => zoomBy(-ZOOM_STEP)} disabled={scale <= MIN_SCALE}>
          −
        </ZoomButton>
        <ZoomButton label="원래대로" onClick={reset} disabled={scale === MIN_SCALE && offset.x === 0 && offset.y === 0}>
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
