import {
  COLOR_BLOCK_PX,
  COLOR_BOUNDARY_MIN_RUN_RATIO,
  COLOR_BOUNDARY_MIN_THRESHOLD,
  COLOR_SPLIT_MIN_ROOM_M2,
  MIN_WALL_THICKNESS_MM,
  SEAL_GAP_RATIO,
  THICK_GRAPHIC_RATIO,
  WALL_ERODE_MAX_PX,
  WALL_ERODE_RATIO
} from "../config/constants";
import type { CropRect, MaskImage, RgbaImage, RoomRegion, WallSegmentPx } from "../model/types";
import { colorBoundaryMask, unionMask } from "./colorBoundary";
import { borderComponentMask, erodeMask, openMask, subtractMask } from "./maskOps";
import { paintWallCenterlines, sealMaskBorder, sealWallGaps } from "./openings";
import { paintExteriorWallBodies } from "./exteriorWalls";
import { findRoomRegions, interiorRegions, labelRoomRegions } from "@/entities/floorplan";

export interface SegmentRoomsInput {
  mask: MaskImage;
  /** 원본 이미지 — 바닥 색이 바뀌는 방 경계를 찾는 데 쓴다 */
  image: RgbaImage;
  crop: CropRect;
  segments: WallSegmentPx[];
  mmPerPx: number;
}

/**
 * 가구 윤곽을 지울 열림 반지름(px).
 * 이 반지름으로 열면 두께 2r+1 미만인 선은 사라지고 그보다 굵은 벽은 원래 두께로 돌아온다.
 * 주거 내벽 최소 두께(100mm)보다 얇은 선은 벽이 아니라 침대·주방가구·설비 그림이다.
 */
export function furnitureOpenRadius(mmPerPx: number): number {
  const minWallPx = MIN_WALL_THICKNESS_MM / mmPerPx;
  return Math.max(0, Math.floor((minWallPx - 1) / 2));
}

/**
 * 실제 벽만 골라낸 두께 중앙값(px).
 * 검출된 세그먼트에는 가구 윤곽이 절반 가까이 섞여 있어, 전체 중앙값을 쓰면 벽 두께를
 * 절반 이하로 잡는다(실측 6px vs 실제 벽 14px). 깎는 깊이·그림 판정이 모두 벽 두께 기준이다.
 */
export function wallThicknessMedianPx(segments: WallSegmentPx[], mmPerPx: number): number {
  const sorted = segments.map((s) => s.thicknessPx).sort((a, b) => a - b);
  const walls = sorted.filter((thickness) => thickness * mmPerPx >= MIN_WALL_THICKNESS_MM);
  const source = walls.length > 0 ? walls : sorted;
  return source.length > 0 ? source[Math.floor(source.length / 2)] : 0;
}

/**
 * 벽 마스크를 방 영역으로 나눈다.
 *
 * 도면에는 침대·주방가구·욕실기구가 가는 윤곽선으로 그려져 있다. 그대로 두면 플러드필이
 * 그 선을 방 경계로 읽어 침대 자리가 구멍이 되고 욕실이 둘로 쪼개진다. 실제 벽인지 가구인지는
 * 두께(mm)로만 갈리므로, 스케일을 안 뒤에 나눈다.
 */
export function segmentRooms({ mask, image, crop, segments, mmPerPx }: SegmentRoomsInput): RoomRegion[] {
  // 벽 두께에 못 미치는 선(발코니 확장선·설비 윤곽)은 틈 메우기·중심선 잇기에도 쓰지 않는다.
  // 같은 축선 위 두 조각 사이를 개구부로 메우면 방 한가운데를 가로지르는 가짜 벽이 생긴다
  const walls = segments.filter((segment) => segment.thicknessPx * mmPerPx >= MIN_WALL_THICKNESS_MM);
  const wallThickness = wallThicknessMedianPx(walls, mmPerPx);

  // 난간·창처럼 굵게 칠해진 그림은 벽이 아니다 — 방 분할용 마스크에서만 걷어내 방 면적을 돌려준다.
  // 다만 크롭 테두리에 닿은 덩어리는 건물 외피(외벽)라 걷어내면 방이 바깥으로 새어 옆방과 뭉친다.
  const graphicRadius = Math.max(1, Math.round((wallThickness * THICK_GRAPHIC_RATIO) / 2));
  const graphics = openMask(mask, graphicRadius);
  const withoutGraphics = subtractMask(mask, subtractMask(graphics, borderComponentMask(graphics)));
  const withoutFurniture = openMask(withoutGraphics, furnitureOpenRadius(mmPerPx));

  // 방 면적을 인쇄 면적 기준(벽 중심선)에 가깝게 맞추려고 벽을 깎는다.
  // 깎이면 벽 끝이 외벽에서 떨어져 옆방으로 새므로, 중심선을 다시 그려 이어 준다. 끝은 깎은 만큼에
  // 벽 두께 절반을 더 늘린다 — 잉크로 잰 벽 끝은 맞닿은 벽의 면에서 몇 px 모자라게 읽히고(모서리 번짐),
  // 실제 벽 사이 틈은 문(600mm 이상)이라 반 두께(~100mm) 연장으로 문을 막는 일은 없다
  const erodeRadius = Math.min(WALL_ERODE_MAX_PX, Math.floor(wallThickness * WALL_ERODE_RATIO));
  const junctionReachPx = erodeRadius + 1 + Math.round(wallThickness / 2);
  const slim = paintWallCenterlines(erodeMask(withoutFurniture, erodeRadius), walls, junctionReachPx);
  // 크롭이 외벽보다 몇 px 넓으면 외벽과 테두리 사이 통로로 방들이 이어진다 — 외벽 몸통을 가장자리에 붙여 막는다
  const flush = paintExteriorWallBodies(slim, walls, crop, mmPerPx, erodeRadius);

  // 문·창이 열려 있으면 플러드필이 방 사이로 새어 방이 하나로 뭉친다 — 사본에서만 틈을 메워 분할한다.
  // 테두리는 깎인 외벽 바깥면만큼 두껍게 막아, 테두리 안쪽 통로로 방들이 이어지지 않게 한다
  const withGapsSealed = sealWallGaps(flush, walls, Math.round(Math.min(mask.width, mask.height) * SEAL_GAP_RATIO));
  const sealed = sealMaskBorder(withGapsSealed, erodeRadius + 1);
  // 벽 없이 바닥 마감재만 바뀌는 경계(주방↔거실 등)를 더한다. 벽 검출 결과는 건드리지 않는다
  const colorEdges = colorBoundaryMask(image, crop, COLOR_BLOCK_PX, COLOR_BOUNDARY_MIN_THRESHOLD, COLOR_BOUNDARY_MIN_RUN_RATIO, sealed, mmPerPx);
  const { regions, owner } = labelRoomRegions(unionMask(sealed, colorEdges));

  // 색 경계로만 떨어진 작은 조각(샤워 트레이·세면대 자리)은 방이 아니다 — 그 조각에 닿은 색 경계만 지우고 다시 나눈다
  const minRoomPx = (COLOR_SPLIT_MIN_ROOM_M2 * 1_000_000) / (mmPerPx * mmPerPx);
  const smallIds = new Set(regions.map((region, index) => (region.areaPx < minRoomPx && !region.touchesBorder ? index : -1)).filter((i) => i >= 0));
  if (smallIds.size === 0) return interiorRegions(regions);
  const relaxed = clearEdgesTouching(colorEdges, owner, smallIds);
  return interiorRegions(findRoomRegions(unionMask(sealed, relaxed)));
}

/** 지정한 영역들의 픽셀에 4-이웃으로 닿은 색 경계 픽셀을 지운다 */
function clearEdgesTouching(edges: MaskImage, owner: Int32Array, ids: Set<number>): MaskImage {
  const cleared: MaskImage = { data: Uint8Array.from(edges.data), width: edges.width, height: edges.height };
  const { width, height } = edges;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (edges.data[i] !== 1) continue;
      const touches =
        (x > 0 && ids.has(owner[i - 1])) ||
        (x < width - 1 && ids.has(owner[i + 1])) ||
        (y > 0 && ids.has(owner[i - width])) ||
        (y < height - 1 && ids.has(owner[i + width]));
      if (touches) cleared.data[i] = 0;
    }
  }
  return cleared;
}
