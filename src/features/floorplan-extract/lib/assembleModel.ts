import type { FloorplanModel2D, Opening2D, PointMm, Room2D, Wall2D } from "@/entities/floorplan";
import {
  ENTRANCE_DOOR_MAX_MM,
  EXTERIOR_EDGE_TOLERANCE_PX,
  OPENING_MAX_MM,
  OPENING_MIN_MM,
  OPENING_ROOM_ADJACENCY_MM
} from "../config/constants";
import { detectWallOpenings, type WallWithOpeningsPx } from "./openings";
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
function isOnCropEdge(wall: WallWithOpeningsPx, crop: CropRect): boolean {
  const isVertical = Math.abs(wall.a.x - wall.b.x) <= Math.abs(wall.a.y - wall.b.y);
  if (isVertical) {
    const x = (wall.a.x + wall.b.x) / 2;
    return x <= EXTERIOR_EDGE_TOLERANCE_PX || crop.width - 1 - x <= EXTERIOR_EDGE_TOLERANCE_PX;
  }
  const y = (wall.a.y + wall.b.y) / 2;
  return y <= EXTERIOR_EDGE_TOLERANCE_PX || crop.height - 1 - y <= EXTERIOR_EDGE_TOLERANCE_PX;
}

const bboxNear = (region: RoomRegion, p: PointMm, mmPerPx: number, padMm: number) => {
  const { minX, minY, maxX, maxY } = region.bbox;
  const pad = padMm / mmPerPx;
  const x = p.x / mmPerPx;
  const y = p.z / mmPerPx;
  return minX - pad <= x && x <= maxX + pad && minY - pad <= y && y <= maxY + pad;
};

/**
 * 개구부 종류를 정한다. 내벽은 문, 외벽은 창이 기본이며
 * 외벽이라도 현관에 접한 좁은 개구부는 현관문으로 본다.
 */
function classifyOpening(
  exterior: boolean,
  widthMm: number,
  centerMm: PointMm,
  entranceRegions: RoomRegion[],
  mmPerPx: number
): Opening2D["type"] {
  if (!exterior) return "door";
  const isEntranceWidth = widthMm <= ENTRANCE_DOOR_MAX_MM;
  const touchesEntrance = entranceRegions.some((region) => bboxNear(region, centerMm, mmPerPx, OPENING_ROOM_ADJACENCY_MM));
  return isEntranceWidth && touchesEntrance ? "door" : "window";
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

  const entranceRegions = regions.filter((region) => labels[region.id]?.label === "현관");
  const detected = detectWallOpenings(segments, OPENING_MIN_MM / mmPerPx, OPENING_MAX_MM / mmPerPx);

  const walls: Wall2D[] = [];
  const openings: Opening2D[] = [];

  detected.forEach((wall, index) => {
    const id = `wall-${index}`;
    const a = pointToMm(wall.a, mmPerPx);
    const b = pointToMm(wall.b, mmPerPx);
    const exterior = isOnCropEdge(wall, crop);
    walls.push({ id, a, b, thicknessMm: toMm(wall.thicknessPx, mmPerPx), exterior });

    const dirX = b.x - a.x;
    const dirZ = b.z - a.z;
    const lengthMm = Math.hypot(dirX, dirZ);
    if (lengthMm === 0) return;

    for (const span of wall.openings) {
      const offsetMm = toMm(span.startPx, mmPerPx);
      const openingWidthMm = toMm(span.endPx - span.startPx, mmPerPx);
      const t = (offsetMm + openingWidthMm / 2) / lengthMm;
      const center: PointMm = { x: a.x + dirX * t, z: a.z + dirZ * t };
      openings.push({
        wallId: id,
        type: classifyOpening(exterior, openingWidthMm, center, entranceRegions, mmPerPx),
        offsetMm,
        widthMm: openingWidthMm
      });
    }
  });

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
    openings,
    printed: { exclusiveAreaM2, dimensionChains: hasChain ? [{ axis: "x", values: chainMm }] : [] },
    confidence: { overall: 0, perRoom }
  };
}
