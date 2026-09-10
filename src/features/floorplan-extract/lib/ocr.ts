import { createWorker, OEM, PSM, type Worker as TesseractWorker } from "tesseract.js";
import { OCR_DIGIT_WHITELIST, OCR_LANGS, OCR_UPSCALE } from "../config/constants";
import type { CropRect, OcrNumberToken, PointPx } from "../model/types";

/** Tesseract는 자체 Worker를 띄우므로 메인 스레드에서 생성한다(중첩 Worker 회피) */
export const createOcrWorker = (): Promise<TesseractWorker> => createWorker(OCR_LANGS, OEM.LSTM_ONLY);

/** 작은 글자 인식률을 위해 영역을 잘라 확대한 캔버스를 만든다 */
export function upscaleRegion(source: CanvasImageSource, rect: CropRect, factor = OCR_UPSCALE): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * factor));
  canvas.height = Math.max(1, Math.round(rect.height * factor));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D 캔버스 컨텍스트를 만들 수 없습니다");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function readText(worker: TesseractWorker, source: CanvasImageSource, rect: CropRect): Promise<string> {
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE, tessedit_char_whitelist: "" });
  const { data } = await worker.recognize(upscaleRegion(source, rect));
  return data.text.trim();
}

/** 영역 안의 숫자 토큰을 원본 이미지 좌표의 중심점과 함께 읽는다(치수 체인용) */
export async function readNumbers(worker: TesseractWorker, source: CanvasImageSource, rect: CropRect): Promise<OcrNumberToken[]> {
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, tessedit_char_whitelist: OCR_DIGIT_WHITELIST });
  const canvas = upscaleRegion(source, rect);
  const { data } = await worker.recognize(canvas, {}, { blocks: true });

  const tokens: OcrNumberToken[] = [];
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        for (const word of line.words) {
          const value = Number.parseInt(word.text, 10);
          if (!Number.isFinite(value)) continue;
          const center: PointPx = {
            x: rect.x + (word.bbox.x0 + word.bbox.x1) / 2 / OCR_UPSCALE,
            y: rect.y + (word.bbox.y0 + word.bbox.y1) / 2 / OCR_UPSCALE
          };
          tokens.push({ value, center });
        }
      }
    }
  }
  return tokens;
}
