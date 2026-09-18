"use client";

import type { RoomLabel } from "@/entities/floorplan";
import { ROOM_LABEL_OPTIONS } from "@/features/floorplan-trace";

interface Props {
  current: RoomLabel;
  onPick: (label: RoomLabel) => void;
  onClose: () => void;
}

export function RoomLabelPicker({ current, onPick, onClose }: Props) {
  return (
    <div role="dialog" aria-label="방 이름 선택" className="flex max-w-56 flex-wrap gap-1 rounded border border-line bg-white p-2 shadow-md">
      {ROOM_LABEL_OPTIONS.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(label)}
          className={`rounded px-2 py-1 text-xs font-medium ${label === current ? "bg-brand text-brand-on" : "border border-line text-fg-heading"}`}
        >
          {label}
        </button>
      ))}
      <button type="button" onClick={onClose} className="rounded px-2 py-1 text-xs text-fg-muted">
        닫기
      </button>
    </div>
  );
}
