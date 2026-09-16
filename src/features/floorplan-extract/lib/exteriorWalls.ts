import { EXTERIOR_EDGE_TOLERANCE_PX, MAX_EXTERIOR_WALL_MM } from "../config/constants";
import type { CropRect, MaskImage, WallSegmentPx } from "../model/types";

const isHorizontal = (s: WallSegmentPx) => Math.abs(s.a.y - s.b.y) <= Math.abs(s.a.x - s.b.x);

export type ExteriorSide = "start" | "end";

/**
 * 세그먼트 몸통이 크롭 가장자리에 닿으면 어느 쪽인지 돌려준다(가로 벽: start=위, end=아래).
 * 두꺼운 덩어리일수록 가장자리에서 멀리 떨어져 읽히므로 허용 거리도 두께만큼 준다.
 */
export function exteriorSide(segment: WallSegmentPx, crop: CropRect): ExteriorSide | null {
  const horizontal = isHorizontal(segment);
  const line = horizontal ? segment.a.y : segment.a.x;
  const extent = horizontal ? crop.height : crop.width;
  const half = segment.thicknessPx / 2;
  const tolerance = Math.max(EXTERIOR_EDGE_TOLERANCE_PX, segment.thicknessPx);
  if (line - half <= tolerance) return "start";
  if (extent - 1 - (line + half) <= tolerance) return "end";
  return null;
}

/**
 * 외벽 몸통을 크롭 가장자리에 붙여 다시 칠한다(가장자리에서 두께 − inset 만큼).
 * 크롭은 굵은 획의 bbox라 외벽보다 몇 px 넓을 수 있고, 그러면 벽과 테두리 사이에 1~2px 통로가 생겨
 * 위·아래 방이 그 통로로 이어진다. 외벽이 실제로 있는 구간만 칠하므로 벽 없이 테두리에 닿은 공간은 줄지 않는다.
 */
export function paintExteriorWallBodies(mask: MaskImage, segments: WallSegmentPx[], crop: CropRect, mmPerPx: number, insetPx: number): MaskImage {
  const painted: MaskImage = { data: Uint8Array.from(mask.data), width: mask.width, height: mask.height };
  const maxThicknessPx = Math.max(1, Math.round(MAX_EXTERIOR_WALL_MM / mmPerPx));
  for (const segment of segments) {
    const side = exteriorSide(segment, crop);
    if (side === null) continue;
    const horizontal = isHorizontal(segment);
    const depth = Math.max(1, Math.min(segment.thicknessPx, maxThicknessPx) - insetPx);
    const extent = horizontal ? crop.height : crop.width;
    const from = horizontal ? Math.min(segment.a.x, segment.b.x) : Math.min(segment.a.y, segment.b.y);
    const to = horizontal ? Math.max(segment.a.x, segment.b.x) : Math.max(segment.a.y, segment.b.y);
    for (let along = Math.max(0, from); along <= Math.min(to, (horizontal ? crop.width : crop.height) - 1); along++) {
      for (let d = 0; d < depth; d++) {
        const line = side === "start" ? d : extent - 1 - d;
        const x = horizontal ? along : line;
        const y = horizontal ? line : along;
        painted.data[y * painted.width + x] = 1;
      }
    }
  }
  return painted;
}

/**
 * 크롭 가장자리에 몸통이 닿는 세그먼트를 외벽으로 보고, 두께를 상한으로 자른 뒤 중심선을 가장자리에 붙인다.
 *
 * 크롭은 유닛 외곽선이라 가장자리에 붙은 벽이 곧 건물 외피다. 도면은 외벽을 단열·마감까지 한 덩어리로
 * 칠하고 모서리는 더 굵게 그려서(실측 327~586mm), 그대로 세우면 실내가 좁아지고 조각마다 중심선이
 * 달라 한 벽으로 묶이지 않는다. 두꺼운 덩어리일수록 가장자리에서 멀리 떨어져 읽히므로 허용 거리도 두께만큼 준다.
 */
export function snapExteriorSegments(segments: WallSegmentPx[], crop: CropRect, mmPerPx: number): WallSegmentPx[] {
  const maxThicknessPx = Math.max(1, Math.round(MAX_EXTERIOR_WALL_MM / mmPerPx));
  return segments.map((segment) => {
    const side = exteriorSide(segment, crop);
    if (side === null) return segment;
    const horizontal = isHorizontal(segment);
    const extent = horizontal ? crop.height : crop.width;
    const thicknessPx = Math.min(segment.thicknessPx, maxThicknessPx);
    const snappedLine = side === "start" ? Math.floor(thicknessPx / 2) : extent - 1 - Math.floor(thicknessPx / 2);
    return horizontal
      ? { a: { x: segment.a.x, y: snappedLine }, b: { x: segment.b.x, y: snappedLine }, thicknessPx }
      : { a: { x: snappedLine, y: segment.a.y }, b: { x: snappedLine, y: segment.b.y }, thicknessPx };
  });
}
