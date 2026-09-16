import { createWorker, OEM, PSM, type Worker as TesseractWorker } from "tesseract.js";
import {
  OCR_BASE_UPSCALE,
  OCR_LANGS,
  OCR_REFERENCE_WIDTH_PX,
  OCR_UPSCALE_MAX,
  OCR_UPSCALE_MIN
} from "../config/constants";
import type { CropRect, OcrNumberToken, OcrTextToken, PointPx } from "../model/types";

/** Tesseract는 자체 Worker를 띄우므로 메인 스레드에서 생성한다(중첩 Worker 회피) */
export const createOcrWorker = (): Promise<TesseractWorker> => createWorker(OCR_LANGS, OEM.LSTM_ONLY);

/** 저해상도 도면일수록 더 크게 확대한다. 글자 높이가 20px 아래로 내려가면 숫자가 읽히지 않는다 */
export function computeOcrUpscale(imageWidthPx: number): number {
  if (imageWidthPx <= 0) return OCR_UPSCALE_MIN;
  const scaled = Math.round((OCR_REFERENCE_WIDTH_PX / imageWidthPx) * OCR_BASE_UPSCALE);
  return Math.min(OCR_UPSCALE_MAX, Math.max(OCR_UPSCALE_MIN, scaled));
}

/** 작은 글자 인식률을 위해 영역을 잘라 확대한 캔버스를 만든다 */
export function upscaleRegion(source: CanvasImageSource, rect: CropRect, factor: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * factor));
  canvas.height = Math.max(1, Math.round(rect.height * factor));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D 캔버스 컨텍스트를 만들 수 없습니다");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}


export interface ReadTextOptions {
  /** 이 밝기 이하만 검정으로, 나머지는 흰색으로 이진화한다. 타일 점무늬·나뭇결 위의 작은 글자를 읽을 때 쓴다 */
  binarizeBelow?: number;
}

/** 캔버스를 검정/흰색으로 이진화한다(회색 밝기 기준) */
function binarizeCanvas(canvas: HTMLCanvasElement, threshold: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const value = gray <= threshold ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * 영역 안의 글자 토큰을 원본 이미지 좌표의 중심점과 함께 읽는다(방 라벨용).
 * 방마다 따로 한 줄 OCR을 돌리면 큰 방의 bbox에 다른 방 글자까지 들어와 뒤섞인다.
 * 한 번에 읽고 위치로 방에 배정하는 편이 정확하고 빠르다.
 */
export async function readTextTokens(
  worker: TesseractWorker,
  source: CanvasImageSource,
  rect: CropRect,
  upscale: number,
  options: ReadTextOptions = {}
): Promise<OcrTextToken[]> {
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, tessedit_char_whitelist: "" });
  const canvas = upscaleRegion(source, rect, upscale);
  if (options.binarizeBelow !== undefined) binarizeCanvas(canvas, options.binarizeBelow);
  const { data } = await worker.recognize(canvas, {}, { blocks: true });

  const tokens: OcrTextToken[] = [];
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        for (const word of line.words) {
          const text = word.text.trim();
          if (text === "") continue;
          tokens.push({
            text,
            center: {
              x: rect.x + (word.bbox.x0 + word.bbox.x1) / 2 / upscale,
              y: rect.y + (word.bbox.y0 + word.bbox.y1) / 2 / upscale
            },
            width: (word.bbox.x1 - word.bbox.x0) / upscale,
            height: (word.bbox.y1 - word.bbox.y0) / upscale
          });
        }
      }
    }
  }
  return tokens;
}

/**
 * 치수로 쓸 수 있는 토큰인지 보고 값을 뽑는다.
 * 숫자만으로 이뤄진 토큰만 인정한다 — "51형"·"51.93"·"(180호)"는 제목·면적·호수이지 치수가 아니다.
 */
export function parseDimensionToken(text: string): number | null {
  const cleaned = text.replace(/,/g, "").trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number.parseInt(cleaned, 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * 영역 안의 치수 숫자를 중심점과 함께 읽는다.
 * 숫자 화이트리스트를 쓰면 한글·소수점이 지워지면서 Tesseract가 단어 경계를 잃고
 * "51형 51.93 (180호)"를 515193180 한 덩어리로 만든다. 그래서 일반 글자로 읽고 토큰 단위로 판별한다.
 */
export async function readNumbers(
  worker: TesseractWorker,
  source: CanvasImageSource,
  rect: CropRect,
  upscale: number
): Promise<OcrNumberToken[]> {
  const tokens = await readTextTokens(worker, source, rect, upscale);
  return tokens.flatMap((token) => {
    const value = parseDimensionToken(token.text);
    return value === null ? [] : [{ value, center: token.center }];
  });
}
