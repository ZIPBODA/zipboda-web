import type { ExtractProgress, GeometryResult, GeometryWorkerResponse } from "../model/types";

/** OpenCV 마스크·벽·방 추출을 Web Worker에서 실행한다(메인 스레드 블로킹 방지). 완료 후 Worker 종료 */
export function runGeometryWorker(imageData: ImageData, onProgress?: (p: ExtractProgress) => void): Promise<GeometryResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./extract.worker.ts", import.meta.url));
    const finish = () => worker.terminate();

    worker.onmessage = (event: MessageEvent<GeometryWorkerResponse>) => {
      const message = event.data;
      if (message.type === "progress") {
        onProgress?.(message.progress);
        return;
      }
      finish();
      if (message.type === "geometry") resolve(message.result);
      else reject(new Error(message.message));
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message));
    };
    worker.postMessage({ type: "geometry", imageData });
  });
}
