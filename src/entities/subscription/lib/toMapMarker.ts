import type { MapMarker } from "@/shared/ui/map";
import type { Subscription } from "../model/types";

/**
 * 좌표가 없는 공고는 지도에 올리지 않는다.
 * 세 화면이 각자 라벨 규칙을 만들지 않도록 변환을 여기 하나로 둔다.
 */
export const toMapMarker = (item: Pick<Subscription, "id" | "title" | "coord">): MapMarker | null =>
  item.coord ? { id: item.id, point: item.coord, label: item.title } : null;

export const toMapMarkers = (items: Pick<Subscription, "id" | "title" | "coord">[]): MapMarker[] =>
  items.flatMap((item) => {
    const marker = toMapMarker(item);
    return marker ? [marker] : [];
  });
