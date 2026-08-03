import type { FloorplanRoom } from "../model/types";

// figma 135:5097 방별 치수 그리드 — 3열
export function RoomSpecGrid({ rooms }: { rooms: FloorplanRoom[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3">
      {rooms.map((room) => (
        <li key={room.name} className="rounded-lg bg-surface-secondary p-3.5">
          <p className="text-xs font-semibold text-gray-700">{room.name}</p>
          <p className="mt-1 text-xs text-fg-disabled">{room.dimensions}</p>
          <p className="mt-0.5 text-xs font-bold text-fg-body">{room.area}</p>
        </li>
      ))}
    </ul>
  );
}
