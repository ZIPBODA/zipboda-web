import cvModule from "@techstark/opencv-js";

export type CV = typeof import("@techstark/opencv-js");

let ready: Promise<CV> | null = null;

/**
 * @techstark/opencv-js는 빌드에 따라 기본 export가 Promise이거나 onRuntimeInitialized 콜백 방식이라
 * 두 경우를 모두 흡수해 초기화 완료된 cv를 한 번만 만든다.
 */
export function getOpenCv(): Promise<CV> {
  if (ready) return ready;
  ready = (async () => {
    const mod: unknown = cvModule;
    if (mod instanceof Promise) return (await mod) as CV;
    const cv = mod as CV & { onRuntimeInitialized?: () => void };
    if (typeof cv.Mat === "function") return cv;
    await new Promise<void>((resolve) => {
      cv.onRuntimeInitialized = () => resolve();
    });
    return cv;
  })();
  return ready;
}
