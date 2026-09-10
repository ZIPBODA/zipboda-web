import type { Mat } from "@techstark/opencv-js";
import { MASK_ON_VALUE, MAX_GRAY, THIN_LINE_OPEN_KERNEL_PX, WALL_CLOSE_KERNEL_PX, WALL_DARK_THRESHOLD } from "../config/constants";
import type { CropRect, MaskImage } from "../model/types";
import type { CV } from "./opencv";

export interface WallMaskResult {
  mask: MaskImage;
  crop: CropRect;
}

function largestContourRect(cv: CV, binary: Mat): CropRect | null {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    let best: CropRect | null = null;
    let bestArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const rect = cv.boundingRect(contour);
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        best = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }
      contour.delete();
    }
    return best;
  } finally {
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * 도면 이미지에서 벽 이진 마스크를 만든다.
 * 벽은 굵은 검정선, 치수선·글자는 가는 선이므로 열림으로 가는 선을 지우고 닫힘으로 벽 틈을 메운다.
 * 가장 큰 외곽 윤곽의 bbox를 유닛 영역으로 잡아 카탈로그 여백을 잘라낸다.
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

    const crop = largestContourRect(cv, closed) ?? { x: 0, y: 0, width: closed.cols, height: closed.rows };
    const data = new Uint8Array(crop.width * crop.height);
    for (let y = 0; y < crop.height; y++) {
      const rowOffset = (crop.y + y) * closed.cols + crop.x;
      for (let x = 0; x < crop.width; x++) {
        if (closed.data[rowOffset + x] === MASK_ON_VALUE) data[y * crop.width + x] = 1;
      }
    }
    return { mask: { data, width: crop.width, height: crop.height }, crop };
  } finally {
    for (const mat of [src, gray, binary, opened, closed, openKernel, closeKernel]) mat.delete();
  }
}
