import {
  REACHABILITY_EXEMPT_UNLABELED_MAX_M2,
  polygonAreaMm2,
  type FloorplanModel2D,
  type Opening2D,
  type PointMm,
  type Room2D,
  type ScaleSource,
  type Wall2D
} from "@/entities/floorplan";
import {
  ENTRANCE_DOOR_MAX_MM,
  ENTRANCE_HINT_RADIUS_MM,
  EXTERIOR_EDGE_TOLERANCE_PX,
  MAX_WALL_THICKNESS_MM,
  MIN_WALL_LENGTH_MM,
  MIN_WALL_THICKNESS_MM,
  OPENING_MAX_MM,
  OPENING_MIN_MM,
  OPENING_ROOM_ADJACENCY_MM
} from "../config/constants";
import { snapExteriorSegments } from "./exteriorWalls";
import { detectWallOpenings, wallTouchesEdge, type WallWithOpeningsPx } from "./openings";
import type { CropRect, LabelMatch, PointPx, RoomRegion, WallSegmentPx } from "../model/types";

export interface AssembleInput {
  /** 세그먼트·영역이 놓인 프레임(작업 해상도). 원본 이미지 크롭이 아닐 수 있다 */
  crop: CropRect;
  /** 위 프레임의 mm/px — 픽셀 기하를 mm로 옮기는 데 쓴다 */
  mmPerPx: number;
  /** 원본 이미지의 mm/px. 모델의 scale로 기록해 검수 오버레이가 원본 위에 결과를 겹칠 수 있게 한다 */
  imageMmPerPx?: number;
  scaleSource: ScaleSource;
  chainMm: number[];
  exclusiveAreaM2?: number;
  segments: WallSegmentPx[];
  regions: RoomRegion[];
  labels: Record<string, LabelMatch>;
  /** "현관" 글자 위치(크롭 px). 현관이 별도 방으로 안 잡혀도 현관문을 창으로 오판하지 않게 한다 */
  entranceHints?: PointPx[];
}

const toMm = (px: number, mmPerPx: number) => Math.round(px * mmPerPx);
const pointToMm = (p: PointPx, mmPerPx: number): PointMm => ({ x: toMm(p.x, mmPerPx), z: toMm(p.y, mmPerPx) });

/** 벽이 크롭 가장자리 선상에 놓였는지 본다. 양 끝점만 보면 벽-벽 사이 칸막이도 외벽으로 오판된다 */
function isOnCropEdge(wall: WallWithOpeningsPx, crop: CropRect): boolean {
  const isVertical = Math.abs(wall.a.x - wall.b.x) <= Math.abs(wall.a.y - wall.b.y);
  const line = isVertical ? (wall.a.x + wall.b.x) / 2 : (wall.a.y + wall.b.y) / 2;
  const extent = isVertical ? crop.width : crop.height;
  return wallTouchesEdge(line, wall.thicknessPx, extent, EXTERIOR_EDGE_TOLERANCE_PX);
}

const bboxNear = (region: RoomRegion, p: PointMm, mmPerPx: number, padMm: number) => {
  const { minX, minY, maxX, maxY } = region.bbox;
  const pad = padMm / mmPerPx;
  const x = p.x / mmPerPx;
  const y = p.z / mmPerPx;
  return minX - pad <= x && x <= maxX + pad && minY - pad <= y && y <= maxY + pad;
};

interface EntranceContext {
  regions: RoomRegion[];
  hints: PointPx[];
  mmPerPx: number;
}

/**
 * 개구부 종류를 정한다. 내벽은 문, 외벽은 창이 기본이며
 * 외벽이라도 현관(방 또는 글자)에 접한 좁은 개구부는 현관문으로 본다.
 */
function classifyOpening(exterior: boolean, widthMm: number, centerMm: PointMm, entrance: EntranceContext): Opening2D["type"] {
  if (!exterior) return "door";
  const isEntranceWidth = widthMm <= ENTRANCE_DOOR_MAX_MM;
  const touchesEntranceRoom = entrance.regions.some((region) => bboxNear(region, centerMm, entrance.mmPerPx, OPENING_ROOM_ADJACENCY_MM));
  const nearEntranceText = entrance.hints.some(
    (hint) => Math.hypot(hint.x * entrance.mmPerPx - centerMm.x, hint.y * entrance.mmPerPx - centerMm.z) <= ENTRANCE_HINT_RADIUS_MM
  );
  return isEntranceWidth && (touchesEntranceRoom || nearEntranceText) ? "door" : "window";
}

/** 픽셀 기하(크롭 좌표)와 OCR 결과를 실척(mm) 2D 모델로 조립한다. 검증·스냅은 normalizeModel이 담당 */
export function assembleModel(input: AssembleInput): FloorplanModel2D {
  const { crop, mmPerPx, imageMmPerPx = mmPerPx, scaleSource, chainMm, exclusiveAreaM2, segments, regions, labels, entranceHints = [] } = input;
  const widthMm = toMm(crop.width, mmPerPx);
  const depthMm = toMm(crop.height, mmPerPx);

  // 영역 윤곽을 그대로 실척으로 옮긴다. bbox 사각형으로 만들면 ㄱ자 방의 면적이 부풀고 방끼리 겹친다
  const bboxPolygon = (region: RoomRegion): PointMm[] => {
    const { minX, minY, maxX, maxY } = region.bbox;
    return [
      { x: toMm(minX, mmPerPx), z: toMm(minY, mmPerPx) },
      { x: toMm(maxX + 1, mmPerPx), z: toMm(minY, mmPerPx) },
      { x: toMm(maxX + 1, mmPerPx), z: toMm(maxY + 1, mmPerPx) },
      { x: toMm(minX, mmPerPx), z: toMm(maxY + 1, mmPerPx) }
    ];
  };

  const allRooms: Room2D[] = regions.map((region, index) => ({
    id: `room-${index}`,
    label: labels[region.id]?.label ?? "기타",
    polygon:
      region.polygon.length >= 3
        ? region.polygon.map((p) => ({ x: toMm(p.x, mmPerPx), z: toMm(p.y, mmPerPx) }))
        : bboxPolygon(region)
  }));
  // 이름 없는 1.5㎡ 이하 공간은 PS·실외기실 같은 설비 공간이다 — 벽은 남기고 바닥(방)으로는 세우지 않는다
  const isServiceSpace = (room: Room2D) => room.label === "기타" && polygonAreaMm2(room.polygon) / 1_000_000 <= REACHABILITY_EXEMPT_UNLABELED_MAX_M2;
  const rooms = allRooms.filter((room) => !isServiceSpace(room));
  const roomIds = new Set(rooms.map((room) => room.id));

  const entrance: EntranceContext = { regions: regions.filter((region) => labels[region.id]?.label === "현관"), hints: entranceHints, mmPerPx };
  // 가는 윤곽선(가구·설비)과 채워 그린 덩어리(PS 상자·난간 띠)는 벽이 아니다. 외벽은 상한으로 잘라 외곽선에 붙인다
  const isWallThickness = (segment: WallSegmentPx) => {
    const thicknessMm = segment.thicknessPx * mmPerPx;
    return MIN_WALL_THICKNESS_MM <= thicknessMm && thicknessMm <= MAX_WALL_THICKNESS_MM;
  };
  const wallSegments = snapExteriorSegments(segments, crop, mmPerPx).filter(isWallThickness);
  // 작은 틈으로 끊긴 조각은 개구부 검출이 한 벽으로 이어 주므로, 길이 판정은 이어 붙인 뒤에 한다
  const isLongEnough = (wall: WallWithOpeningsPx) => Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y) * mmPerPx >= MIN_WALL_LENGTH_MM;
  const detected = detectWallOpenings(wallSegments, OPENING_MIN_MM / mmPerPx, OPENING_MAX_MM / mmPerPx).filter(isLongEnough);

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
        type: classifyOpening(exterior, openingWidthMm, center, entrance),
        offsetMm,
        widthMm: openingWidthMm
      });
    }
  });

  const perRoom = Object.fromEntries(
    regions.map((region, index) => [`room-${index}`, labels[region.id]?.confidence ?? 0] as const).filter(([id]) => roomIds.has(id))
  );
  const hasChain = chainMm.length > 1;

  return {
    scale: { mmPerPx: imageMmPerPx, source: scaleSource },
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
