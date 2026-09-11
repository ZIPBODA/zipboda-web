import { normalizeModel, type NormalizeResult } from "@/entities/floorplan";
import { DIMENSION_BAND_RATIO, SCALE_MAX_FALLBACK_CONFIDENCE } from "../config/constants";
import type { CropRect, ExtractProgress, GeometryResult, ScaleEstimate } from "../model/types";
import { assembleModel } from "./assembleModel";
import { assignRegionLabels } from "./labelAssign";
import { createOcrWorker, readNumbers, readTextTokens } from "./ocr";
import { runGeometryWorker } from "./runGeometryWorker";
import { estimateScale } from "./scaleFromChains";

export interface ExtractOptions {
  exclusiveAreaM2?: number;
  /** 치수 OCR이 실패했을 때 유닛 폭(mm)으로 스케일을 정하는 수동 폴백 */
  fallbackWidthMm?: number;
  onProgress?: (progress: ExtractProgress) => void;
}

export interface ExtractOutput {
  result: NormalizeResult;
  geometry: GeometryResult;
}

function imageToImageData(image: HTMLImageElement): { imageData: ImageData; canvas: HTMLCanvasElement } {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D 캔버스 컨텍스트를 만들 수 없습니다");
  ctx.drawImage(image, 0, 0);
  return { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height), canvas };
}

/** 치수 체인은 유닛 바깥 위쪽 띠에 인쇄되므로 크롭 상단 밖 영역을 읽는다 */
function topDimensionBand(crop: CropRect, imageWidth: number): CropRect {
  const height = Math.round(crop.height * DIMENSION_BAND_RATIO);
  const y = Math.max(0, crop.y - height);
  return { x: Math.max(0, crop.x - height), y, width: Math.min(imageWidth, crop.width + height * 2), height: crop.y - y };
}

const manualScale = (widthMm: number | undefined, cropWidthPx: number): ScaleEstimate | null =>
  widthMm && cropWidthPx > 0
    ? { mmPerPx: widthMm / cropWidthPx, totalMm: widthMm, chainMm: [widthMm], confidence: SCALE_MAX_FALLBACK_CONFIDENCE }
    : null;


/**
 * 도면 이미지 → 벽/방 기하(Worker) → 라벨·치수 OCR(메인) → mm 모델 조립 → 정규화·검증.
 * 공고·타입당 1회 실행하고 결과를 저장해 재사용한다.
 */
export async function extractFloorplan(image: HTMLImageElement, options: ExtractOptions = {}): Promise<ExtractOutput> {
  const { onProgress, exclusiveAreaM2, fallbackWidthMm } = options;
  const { imageData, canvas } = imageToImageData(image);

  const geometry = await runGeometryWorker(imageData, onProgress);

  const ocr = await createOcrWorker();
  try {
    onProgress?.({ stage: "labels", ratio: 0.75 });
    // 크롭 전체를 한 번 읽고 위치로 방에 배정한다 — 방마다 따로 읽으면 큰 방이 남의 글자까지 가져간다
    const imageTokens = await readTextTokens(ocr, canvas, geometry.crop);
    const cropTokens = imageTokens.map((t) => ({
      ...t,
      center: { x: t.center.x - geometry.crop.x, y: t.center.y - geometry.crop.y }
    }));
    const labels = assignRegionLabels(geometry.regions, cropTokens);

    onProgress?.({ stage: "scale", ratio: 0.9 });
    const numbers = await readNumbers(ocr, canvas, topDimensionBand(geometry.crop, canvas.width));
    const scale =
      estimateScale(
        numbers.map((t) => t.value),
        geometry.crop.width
      ) ?? manualScale(fallbackWidthMm, geometry.crop.width);
    if (!scale) throw new Error("치수를 읽을 수 없어 스케일을 정할 수 없습니다. 실측 폭(mm)을 입력해 주세요.");

    onProgress?.({ stage: "normalize", ratio: 0.97 });
    const model = assembleModel({
      crop: geometry.crop,
      mmPerPx: scale.mmPerPx,
      chainMm: scale.chainMm,
      exclusiveAreaM2,
      segments: geometry.segments,
      regions: geometry.regions,
      labels
    });
    return { result: normalizeModel(model), geometry };
  } finally {
    await ocr.terminate();
  }
}
