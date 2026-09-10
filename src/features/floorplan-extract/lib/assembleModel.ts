import type { FloorplanModel2D, PointMm, Room2D, Wall2D } from "@/entities/floorplan";
import { EXTERIOR_EDGE_TOLERANCE_PX } from "../config/constants";
import type { CropRect, LabelMatch, PointPx, RoomRegion, WallSegmentPx } from "../model/types";

export interface AssembleInput {
  crop: CropRect;
  mmPerPx: number;
  chainMm: number[];
  exclusiveAreaM2?: number;
  segments: WallSegmentPx[];
  regions: RoomRegion[];
  labels: Record<string, LabelMatch>;
}

const toMm = (px: number, mmPerPx: number) => Math.round(px * mmPerPx);
const pointToMm = (p: PointPx, mmPerPx: number): PointMm => ({ x: toMm(p.x, mmPerPx), z: toMm(p.y, mmPerPx) });

/** 벽이 크롭 가장자리 선상에 놓였는지 본다. 양 끝점만 보면 벽-벽 사이 칸막이도 외벽으로 오판된다 */
function isOnCropEdge(segment: WallSegmentPx, crop: CropRect): boolean {
  const isVertical = Math.abs(segment.a.x - segment.b.x) <= Math.abs(segment.a.y - segment.b.y);
  if (isVertical) {
    const x = (segment.a.x + segment.b.x) / 2;
    return x <= EXTERIOR_EDGE_TOLERANCE_PX || crop.width - 1 - x <= EXTERIOR_EDGE_TOLERANCE_PX;
  }
  const y = (segment.a.y + segment.b.y) / 2;
  return y <= EXTERIOR_EDGE_TOLERANCE_PX || crop.height - 1 - y <= EXTERIOR_EDGE_TOLERANCE_PX;
}

/** 픽셀 기하(크롭 좌표)와 OCR 결과를 실척(mm) 2D 모델로 조립한다. 검증·스냅은 normalizeModel이 담당 */
export function assembleModel(input: AssembleInput): FloorplanModel2D {
  const { crop, mmPerPx, chainMm, exclusiveAreaM2, segments, regions, labels } = input;
  const widthMm = toMm(crop.width, mmPerPx);
  const depthMm = toMm(crop.height, mmPerPx);

  const rooms: Room2D[] = regions.map((region, index) => {
    const { minX, minY, maxX, maxY } = region.bbox;
    return {
      id: `room-${index}`,
      label: labels[region.id]?.label ?? "기타",
      polygon: [
        { x: toMm(minX, mmPerPx), z: toMm(minY, mmPerPx) },
        { x: toMm(maxX + 1, mmPerPx), z: toMm(minY, mmPerPx) },
        { x: toMm(maxX + 1, mmPerPx), z: toMm(maxY + 1, mmPerPx) },
        { x: toMm(minX, mmPerPx), z: toMm(maxY + 1, mmPerPx) }
      ]
    };
  });

  const walls: Wall2D[] = segments.map((segment, index) => ({
    id: `wall-${index}`,
    a: pointToMm(segment.a, mmPerPx),
    b: pointToMm(segment.b, mmPerPx),
    thicknessMm: toMm(segment.thicknessPx, mmPerPx),
    exterior: isOnCropEdge(segment, crop)
  }));

  const perRoom = Object.fromEntries(regions.map((region, index) => [`room-${index}`, labels[region.id]?.confidence ?? 0]));
  const hasChain = chainMm.length > 1;

  return {
    scale: { mmPerPx, source: hasChain ? "dimension-chain" : "estimated" },
    outline: [
      { x: 0, z: 0 },
      { x: widthMm, z: 0 },
      { x: widthMm, z: depthMm },
      { x: 0, z: depthMm }
    ],
    rooms,
    walls,
    openings: [],
    printed: { exclusiveAreaM2, dimensionChains: hasChain ? [{ axis: "x", values: chainMm }] : [] },
    confidence: { overall: 0, perRoom }
  };
}
