import { pointInPolygon, type PointMm } from "@/entities/floorplan";
import type { DerivedRoom, LabelAnchor, LabeledRoom } from "../model/types";

/** 앵커가 들어 있는 방에 이름을 붙인다. 한 방에 여러 앵커가 들면 나중 것이 이긴다 */
export function resolveRoomLabels(rooms: readonly DerivedRoom[], anchors: readonly LabelAnchor[]): LabeledRoom[] {
  return rooms.map((room) => {
    const inside = anchors.filter((anchor) => pointInPolygon(anchor.at, room.polygon));
    const winner = inside[inside.length - 1];
    return { ...room, label: winner?.label ?? "기타", anchorId: winner?.id ?? null };
  });
}

export function roomAt<T extends DerivedRoom>(rooms: readonly T[], p: PointMm): T | null {
  return rooms.find((room) => pointInPolygon(p, room.polygon)) ?? null;
}
