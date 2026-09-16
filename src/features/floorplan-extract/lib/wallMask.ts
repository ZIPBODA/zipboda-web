import {
  CROP_PASS_MAX_LONG_EDGE_PX,
  MASK_ON_VALUE,
  MAX_GRAY,
  THIN_LINE_OPEN_KERNEL_PX,
  UNIT_REGION_CELL_MAX_PX,
  UNIT_REGION_CELL_MIN_PX,
  UNIT_REGION_CELL_RATIO,
  UNIT_REGION_MAX_FILL,
  UNIT_REGION_MIN_AREA_RATIO,
  UNIT_REGION_MIN_FILL,
  UNIT_CORE_OPEN_RATIO,
  WALL_CLOSE_KERNEL_PX,
  WORKING_MM_PER_PX
} from "../config/constants";
import type { CropRect, MaskImage, RgbaImage, WorkingFrame } from "../model/types";
import { findUnitRegion } from "./unitRegion";
import { openMask } from "./maskOps";
import type { CV } from "./opencv";
import { wallThresholds } from "./thresholds";

type Mat = InstanceType<CV["Mat"]>;

export interface WallMaskResult {
  mask: MaskImage;
  /** 검정 잉크만 켠 마스크. 갈색·회색 가구를 벽에서 가르는 데 쓴다 */
  ink: MaskImage;
  /** 작업 해상도 크롭 RGBA */
  image: RgbaImage;
  working: WorkingFrame;
}

const toMask = (binary: Mat): MaskImage => {
  const mask: MaskImage = { data: new Uint8Array(binary.cols * binary.rows), width: binary.cols, height: binary.rows };
  for (let i = 0; i < mask.data.length; i++) if (binary.data[i] === MASK_ON_VALUE) mask.data[i] = 1;
  return mask;
};

/** 임계 → 열림(가는 선 제거) → 닫힘(벽 틈 메움). 벽은 굵은 실선, 치수선·글자는 가는 선이다 */
function morphWallMask(cv: CV, gray: Mat, darkThreshold: number): MaskImage {
  const binary = new cv.Mat();
  const opened = new cv.Mat();
  const closed = new cv.Mat();
  const openKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(THIN_LINE_OPEN_KERNEL_PX, THIN_LINE_OPEN_KERNEL_PX));
  const closeKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(WALL_CLOSE_KERNEL_PX, WALL_CLOSE_KERNEL_PX));
  try {
    cv.threshold(gray, binary, darkThreshold, MAX_GRAY, cv.THRESH_BINARY_INV);
    cv.morphologyEx(binary, opened, cv.MORPH_OPEN, openKernel);
    cv.morphologyEx(opened, closed, cv.MORPH_CLOSE, closeKernel);
    return toMask(closed);
  } finally {
    for (const mat of [binary, opened, closed, openKernel, closeKernel]) mat.delete();
  }
}

/**
 * 원본 이미지에서 유닛(도면) 영역을 찾는다. 카탈로그 여백·제목·표를 걷어낸 크롭을 원본 px로 돌려준다.
 * 큰 스캔은 긴 변을 줄여서 본다 — 그대로 보면 치수선이 열림 커널보다 굵어 벽 마스크에 남는다.
 */
export function detectUnitCrop(cv: CV, imageData: ImageData): CropRect {
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const small = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const longEdge = Math.max(gray.cols, gray.rows);
    const shrink = longEdge > CROP_PASS_MAX_LONG_EDGE_PX ? CROP_PASS_MAX_LONG_EDGE_PX / longEdge : 1;
    if (shrink < 1) cv.resize(gray, small, new cv.Size(Math.round(gray.cols * shrink), Math.round(gray.rows * shrink)), 0, 0, cv.INTER_AREA);
    const work = shrink < 1 ? small : gray;

    const { dark } = wallThresholds(work.data as Uint8Array);
    const mask = morphWallMask(cv, work, dark);
    const cellPx = Math.min(
      UNIT_REGION_CELL_MAX_PX,
      Math.max(UNIT_REGION_CELL_MIN_PX, Math.round(Math.min(mask.width, mask.height) * UNIT_REGION_CELL_RATIO))
    );
    const coreRadius = Math.max(1, Math.round(Math.max(mask.width, mask.height) * UNIT_CORE_OPEN_RATIO));
    const found = findUnitRegion(mask, {
      cellPx,
      minFillRatio: UNIT_REGION_MIN_FILL,
      maxFillRatio: UNIT_REGION_MAX_FILL,
      minAreaRatio: UNIT_REGION_MIN_AREA_RATIO,
      core: openMask(mask, coreRadius)
    }) ?? { x: 0, y: 0, width: mask.width, height: mask.height };

    const scaleBack = (v: number) => Math.round(v / shrink);
    return {
      x: Math.max(0, scaleBack(found.x)),
      y: Math.max(0, scaleBack(found.y)),
      width: Math.min(imageData.width - scaleBack(found.x), scaleBack(found.width)),
      height: Math.min(imageData.height - scaleBack(found.y), scaleBack(found.height))
    };
  } finally {
    for (const mat of [src, gray, small]) mat.delete();
  }
}

/**
 * 크롭을 작업 해상도(WORKING_MM_PER_PX)로 다시 샘플링해 벽 마스크·잉크 마스크를 만든다.
 * 입력 해상도가 어떻든 벽은 항상 같은 px 두께로 보이므로 형태학·런·두께 상수가 한 값으로 통한다.
 * 임계는 크롭의 밝기 분포에서 정한다 — 스캔마다 검정·종이 밝기가 다르다.
 */
export function buildWallMask(cv: CV, imageData: ImageData, crop: CropRect, mmPerPx: number): WallMaskResult {
  const factor = mmPerPx / WORKING_MM_PER_PX;
  const width = Math.max(1, Math.round(crop.width * factor));
  const height = Math.max(1, Math.round(crop.height * factor));
  const frame = { width, height, mmPerPx: (crop.width * mmPerPx) / width };

  const src = cv.matFromImageData(imageData);
  const resized = new cv.Mat();
  const gray = new cv.Mat();
  const inkBinary = new cv.Mat();
  let roi: Mat | null = null;
  try {
    roi = src.roi(new cv.Rect(crop.x, crop.y, crop.width, crop.height));
    // 줄일 때는 면적 평균으로 무늬를 뭉개고, 키울 때는 선형 보간으로 계단을 만들지 않는다
    cv.resize(roi, resized, new cv.Size(width, height), 0, 0, factor < 1 ? cv.INTER_AREA : cv.INTER_LINEAR);
    cv.cvtColor(resized, gray, cv.COLOR_RGBA2GRAY);

    const { dark, ink } = wallThresholds(gray.data as Uint8Array);
    const mask = morphWallMask(cv, gray, dark);
    cv.threshold(gray, inkBinary, ink, MAX_GRAY, cv.THRESH_BINARY_INV);

    const image: RgbaImage = { data: new Uint8ClampedArray(resized.data), width, height };
    const working: WorkingFrame = { ...frame, inkGray: ink, darkGray: dark };
    return { mask, ink: toMask(inkBinary), image, working };
  } finally {
    for (const mat of [src, resized, gray, inkBinary, roi]) mat?.delete();
  }
}
