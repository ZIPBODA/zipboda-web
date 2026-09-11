import { LABEL_UNKNOWN_CONFIDENCE } from "../config/constants";
import type { LabelMatch, OcrTextToken, PointPx, RoomRegion } from "../model/types";
import { mapRoomLabel } from "./labelMap";

/** 광선 투사(ray casting) — 폴리곤 안에 점이 있는지 */
export function pointInPolygon(point: PointPx, polygon: PointPx[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const straddles = a.y > point.y !== b.y > point.y;
    if (!straddles) continue;
    const crossX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (point.x < crossX) inside = !inside;
  }
  return inside;
}

const inBBox = (point: PointPx, region: RoomRegion) =>
  region.bbox.minX <= point.x && point.x <= region.bbox.maxX && region.bbox.minY <= point.y && point.y <= region.bbox.maxY;

/** 윤곽이 있으면 윤곽으로, 없으면 bbox로 판정한다. bbox는 ㄱ자 방에서 남의 글자까지 품는다 */
const contains = (region: RoomRegion, point: PointPx) =>
  region.polygon.length >= 3 ? pointInPolygon(point, region.polygon) : inBBox(point, region);

/**
 * 글자 토큰을 위치로 방에 배정해 라벨을 정한다.
 * 한 방에 여러 토큰이 들어오면 가장 확신이 큰 것을 쓴다(도면에는 방 이름 외 치수·설비명도 적혀 있다).
 */
export function assignRegionLabels(regions: RoomRegion[], tokens: OcrTextToken[]): Record<string, LabelMatch> {
  const labels: Record<string, LabelMatch> = {};

  for (const region of regions) {
    let best: LabelMatch = { label: "기타", confidence: LABEL_UNKNOWN_CONFIDENCE };
    for (const token of tokens) {
      if (!contains(region, token.center)) continue;
      const match = mapRoomLabel(token.text);
      if (match.confidence > best.confidence) best = match;
    }
    labels[region.id] = best;
  }
  return labels;
}
