"use client";

import { useRef, useState } from "react";
import type { Axis } from "../../lib/types";

const RADIUS = 32;

// figma 353:3919/353:3921 워크스루 조이스틱(이동/시점) — 터치·포인터로 [-1,1] 벡터 출력
export function Joystick({ label, side, onChange }: { label: string; side: "left" | "right"; onChange: (v: Axis) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const [knob, setKnob] = useState<Axis>({ x: 0, y: 0 });

  const move = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    onChange({ x: dx / RADIUS, y: dy / RADIUS });
  };

  const end = (e: React.PointerEvent) => {
    active.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    setKnob({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
  };

  return (
    <div
      ref={base}
      aria-label={`${label} 조이스틱`}
      className={`pointer-events-auto absolute bottom-6 flex size-20 touch-none items-center justify-center rounded-full border-2 border-white/40 bg-white/15 ${
        side === "left" ? "left-6" : "right-6"
      }`}
      onPointerDown={(e) => {
        active.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span className="size-9 rounded-full bg-white/70" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} aria-hidden />
    </div>
  );
}
