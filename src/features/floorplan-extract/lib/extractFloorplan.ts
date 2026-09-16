import { ENTRANCE_LABEL, normalizeModel, type NormalizeResult, type ScaleSource } from "@/entities/floorplan";
import {
  DIMENSION_BAND_RATIO,
  DIMENSION_BAND_X_MARGIN_RATIO,
  LABEL_RETRY_MIN_ROOM_M2,
  LABEL_RETRY_UPSCALE_FACTOR,
  SCALE_MAX_FALLBACK_CONFIDENCE
} from "../config/constants";
import type { CropRect, ExtractProgress, GeometryResult, OcrNumberToken, OcrTextToken, RoomRegion, ScaleEstimate } from "../model/types";
import { assembleModel } from "./assembleModel";
import { assignRegionLabels } from "./labelAssign";
import { mapRoomLabel } from "./labelMap";
import { mergeTextTokens } from "./mergeTokens";
import { computeOcrUpscale, createOcrWorker, readNumbers, readTextTokens } from "./ocr";
import { createGeometryWorker } from "./runGeometryWorker";
import { segmentRooms } from "./segmentRooms";
import { estimateScale, scaleFromArea } from "./scaleFromChains";

export interface ExtractOptions {
  exclusiveAreaM2?: number;
  /** 치수 OCR이 실패했을 때 유닛 폭(mm)으로 스케일을 정하는 수동 폴백 */
  fallbackWidthMm?: number;
  onProgress?: (progress: ExtractProgress) => void;
}

export interface ExtractOutput {
  result: NormalizeResult;
  geometry: GeometryResult;
  /** 치수 OCR 결과 — 스케일을 왜 그렇게 잡았는지 검수 화면에서 확인한다 */
  dimension: { band: CropRect; numbers: OcrNumberToken[] };
  /** 방 라벨 OCR 결과(크롭 기준 좌표) — 어떤 글자를 어디서 읽어 라벨을 정했는지 확인한다 */
  labelTokens: OcrTextToken[];
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
/** 도면 바로 위에서 가로 치수 숫자를 찾는 띠. 좌우 세로 치수 열이 섞이지 않도록 폭은 크롭에 붙여 잡는다 */
export function topDimensionBand(crop: CropRect, imageWidth: number): CropRect {
  const height = Math.round(crop.height * DIMENSION_BAND_RATIO);
  const y = Math.max(0, crop.y - height);
  const margin = Math.round(crop.width * DIMENSION_BAND_X_MARGIN_RATIO);
  const x = Math.max(0, crop.x - margin);
  return { x, y, width: Math.min(imageWidth - x, crop.width + margin * 2), height: crop.y - y };
}

/** 작업 프레임의 방 bbox를 원본 이미지 px 사각형으로 옮긴다(재OCR용) */
function regionRectInImage(region: RoomRegion, crop: CropRect, toWorking: number): CropRect {
  const x = crop.x + region.bbox.minX / toWorking;
  const y = crop.y + region.bbox.minY / toWorking;
  return {
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
    width: Math.round((region.bbox.maxX - region.bbox.minX + 1) / toWorking),
    height: Math.round((region.bbox.maxY - region.bbox.minY + 1) / toWorking)
  };
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

  const geometryWorker = createGeometryWorker(onProgress);
  const ocr = await createOcrWorker();
  try {
    const crop = await geometryWorker.detectCrop(imageData);
    const upscale = computeOcrUpscale(canvas.width);

    onProgress?.({ stage: "scale", ratio: 0.3 });
    const band = topDimensionBand(crop, canvas.width);
    const numbers = await readNumbers(ocr, canvas, band, upscale);
    // 치수 체인 → 인쇄 전용면적 역산 → 수동 실측 폭 순으로 자동성이 높은 쪽을 먼저 쓴다
    const chainScale = estimateScale(
      numbers.map((t) => t.value),
      crop.width
    );
    const areaScale = scaleFromArea(exclusiveAreaM2, crop.width * crop.height);
    const scale = chainScale ?? areaScale ?? manualScale(fallbackWidthMm, crop.width);
    const scaleSource: ScaleSource = chainScale ? "dimension-chain" : areaScale ? "area" : "estimated";
    if (!scale) {
      const read = numbers.map((t) => t.value).join(", ");
      throw new Error(
        `치수를 읽을 수 없어 스케일을 정할 수 없습니다. 실측 폭(mm)을 입력해 주세요. (읽은 숫자: ${read === "" ? "없음" : read})`
      );
    }

    // 벽·방은 입력 해상도가 아니라 작업 해상도(mm/px 고정)에서 뽑는다 — 어떤 스캔이든 같은 px 기준이 통한다
    const wallGeometry = await geometryWorker.extractWalls(imageData, crop, scale.mmPerPx);
    const { working } = wallGeometry;
    const workingCrop = { x: 0, y: 0, width: working.width, height: working.height };

    // 방 분할은 스케일을 알고 나서 한다 — 가구 윤곽과 벽은 두께(mm)로만 갈린다
    onProgress?.({ stage: "rooms", ratio: 0.7 });
    const regions = segmentRooms({
      mask: wallGeometry.mask,
      image: wallGeometry.image,
      crop: workingCrop,
      segments: wallGeometry.segments,
      mmPerPx: working.mmPerPx
    });
    const geometry: GeometryResult = { ...wallGeometry, regions };

    onProgress?.({ stage: "labels", ratio: 0.85 });
    // 크롭 전체를 한 번 읽고 위치로 방에 배정한다 — 방마다 따로 읽으면 큰 방이 남의 글자까지 가져간다
    const imageTokens = await readTextTokens(ocr, canvas, crop, upscale);
    // Tesseract가 한글을 글자 단위로 내놓아 그대로 쓰면 "방" 한 글자가 침실로 잡힌다 — 단어로 되돌린다
    const cropTokens = mergeTextTokens(
      imageTokens.map((t) => ({ ...t, center: { x: t.center.x - crop.x, y: t.center.y - crop.y } }))
    );
    // 방 영역은 작업 프레임 px이므로 글자 위치도 같은 프레임으로 옮겨 배정한다
    const toWorking = scale.mmPerPx / working.mmPerPx;
    const workingTokens = cropTokens.map((t) => ({ ...t, center: { x: t.center.x * toWorking, y: t.center.y * toWorking } }));
    const labels = assignRegionLabels(regions, workingTokens);
    // 크롭 전체 OCR이 놓친 방은 그 방만 확대해 다시 읽는다 — 작은 글자(욕실·현관)는 전체 읽기에서 자주 빠진다
    onProgress?.({ stage: "labels", ratio: 0.9 });
    for (const region of regions) {
      const current = labels[region.id];
      const areaM2 = (region.areaPx * working.mmPerPx ** 2) / 1_000_000;
      const needsRetry = current !== undefined && current.label === "기타" && areaM2 > LABEL_RETRY_MIN_ROOM_M2;
      if (!needsRetry) continue;
      const rect = regionRectInImage(region, crop, toWorking);
      // 타일 점무늬 위의 글자는 확대만으로 안 읽힌다 — 어두운 픽셀 기준으로 이진화해 무늬를 지우고 읽는다
      const retryTokens = mergeTextTokens(
        await readTextTokens(ocr, canvas, rect, upscale * LABEL_RETRY_UPSCALE_FACTOR, { binarizeBelow: working.darkGray })
      );
      const best = retryTokens.map((token) => mapRoomLabel(token.text)).reduce((a, b) => (b.confidence > a.confidence ? b : a), current);
      if (best.confidence > current.confidence) labels[region.id] = best;
    }
    const entranceHints = workingTokens.filter((token) => mapRoomLabel(token.text).label === ENTRANCE_LABEL).map((token) => token.center);

    onProgress?.({ stage: "normalize", ratio: 0.97 });
    const model = assembleModel({
      crop: workingCrop,
      mmPerPx: working.mmPerPx,
      imageMmPerPx: scale.mmPerPx,
      scaleSource,
      chainMm: scale.chainMm,
      exclusiveAreaM2,
      segments: wallGeometry.segments,
      regions,
      labels,
      entranceHints
    });
    return { result: normalizeModel(model), geometry, dimension: { band, numbers }, labelTokens: cropTokens };
  } finally {
    geometryWorker.terminate();
    await ocr.terminate();
  }
}
