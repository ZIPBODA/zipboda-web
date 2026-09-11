import {
  MASK_ON_VALUE,
  MAX_GRAY,
  THIN_LINE_OPEN_KERNEL_PX,
  UNIT_REGION_CELL_MAX_PX,
  UNIT_REGION_CELL_MIN_PX,
  UNIT_REGION_CELL_RATIO,
  UNIT_REGION_MAX_FILL,
  UNIT_REGION_MIN_AREA_RATIO,
  UNIT_REGION_MIN_FILL,
  WALL_CLOSE_KERNEL_PX,
  WALL_DARK_THRESHOLD
} from "../config/constants";
import type { CropRect, MaskImage } from "../model/types";
import { findUnitRegion } from "./unitRegion";
import type { CV } from "./opencv";

export interface WallMaskResult {
  mask: MaskImage;
  crop: CropRect;
}

/**
 * 도면 이미지에서 벽 이진 마스크를 만든다.
 * 벽은 굵은 검정선, 치수선·글자는 가는 선이므로 열림으로 가는 선을 지우고 닫힘으로 벽 틈을 메운다.
 * 카탈로그 여백은 findUnitRegion으로 도면 영역만 남겨 잘라낸다.
 */
export function buildWallMask(cv: CV, imageData: ImageData): WallMaskResult {
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const opened = new cv.Mat();
  const closed = new cv.Mat();
  const openKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(THIN_LINE_OPEN_KERNEL_PX, THIN_LINE_OPEN_KERNEL_PX));
  const closeKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(WALL_CLOSE_KERNEL_PX, WALL_CLOSE_KERNEL_PX));

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, WALL_DARK_THRESHOLD, MAX_GRAY, cv.THRESH_BINARY_INV);
    cv.morphologyEx(binary, opened, cv.MORPH_OPEN, openKernel);
    cv.morphologyEx(opened, closed, cv.MORPH_CLOSE, closeKernel);

    const full: MaskImage = { data: new Uint8Array(closed.cols * closed.rows), width: closed.cols, height: closed.rows };
    for (let i = 0; i < full.data.length; i++) if (closed.data[i] === MASK_ON_VALUE) full.data[i] = 1;

    const cellPx = Math.min(
      UNIT_REGION_CELL_MAX_PX,
      Math.max(UNIT_REGION_CELL_MIN_PX, Math.round(Math.min(full.width, full.height) * UNIT_REGION_CELL_RATIO))
    );
    const crop =
      findUnitRegion(full, {
        cellPx,
        minFillRatio: UNIT_REGION_MIN_FILL,
        maxFillRatio: UNIT_REGION_MAX_FILL,
        minAreaRatio: UNIT_REGION_MIN_AREA_RATIO
      }) ?? { x: 0, y: 0, width: full.width, height: full.height };

    const data = new Uint8Array(crop.width * crop.height);
    for (let y = 0; y < crop.height; y++) {
      const rowOffset = (crop.y + y) * full.width + crop.x;
      for (let x = 0; x < crop.width; x++) data[y * crop.width + x] = full.data[rowOffset + x];
    }
    return { mask: { data, width: crop.width, height: crop.height }, crop };
  } finally {
    for (const mat of [src, gray, binary, opened, closed, openKernel, closeKernel]) mat.delete();
  }
}
