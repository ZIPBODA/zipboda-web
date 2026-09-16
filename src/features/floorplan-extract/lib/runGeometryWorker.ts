import type { CropRect, ExtractProgress, GeometryWorkerRequest, GeometryWorkerResponse, WallGeometry } from "../model/types";

export interface GeometryWorkerSession {
  /** 원본 이미지에서 유닛 크롭(원본 px)을 찾는다 */
  detectCrop(imageData: ImageData): Promise<CropRect>;
  /** 스케일을 안 뒤 크롭을 작업 해상도로 다시 샘플링해 벽 마스크·세그먼트를 뽑는다 */
  extractWalls(imageData: ImageData, crop: CropRect, mmPerPx: number): Promise<WallGeometry>;
  terminate(): void;
}

/**
 * OpenCV 처리를 Web Worker에서 실행한다(메인 스레드 블로킹 방지).
 * 크롭 검출과 벽 추출 사이에 메인 스레드가 치수 OCR로 스케일을 정해야 하므로 두 번 오가며, WASM 초기화는 한 번만 한다.
 */
export function createGeometryWorker(onProgress?: (p: ExtractProgress) => void): GeometryWorkerSession {
  const worker = new Worker(new URL("./extract.worker.ts", import.meta.url));

  const request = <T>(message: GeometryWorkerRequest, pick: (response: GeometryWorkerResponse) => T | undefined) =>
    new Promise<T>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<GeometryWorkerResponse>) => {
        const response = event.data;
        if (response.type === "progress") {
          onProgress?.(response.progress);
          return;
        }
        if (response.type === "error") {
          reject(new Error(response.message));
          return;
        }
        const value = pick(response);
        if (value !== undefined) resolve(value);
      };
      worker.onerror = (event) => reject(new Error(event.message));
      worker.postMessage(message);
    });

  return {
    detectCrop: (imageData) => request({ type: "crop", imageData }, (r) => (r.type === "crop" ? r.crop : undefined)),
    extractWalls: (imageData, crop, mmPerPx) =>
      request({ type: "walls", imageData, crop, mmPerPx }, (r) => (r.type === "walls" ? r.result : undefined)),
    terminate: () => worker.terminate()
  };
}
