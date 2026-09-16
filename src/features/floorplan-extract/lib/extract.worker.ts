/// <reference lib="webworker" />

import type { GeometryWorkerRequest, GeometryWorkerResponse } from "../model/types";
import { WALL_INK_MIN_RATIO } from "../config/constants";
import { getOpenCv } from "./opencv";
import { buildWallMask, detectUnitCrop } from "./wallMask";
import { extractWallSegments, filterInkSegments } from "./wallSegments";

const post = (message: GeometryWorkerResponse) => self.postMessage(message);

self.onmessage = async (event: MessageEvent<GeometryWorkerRequest>) => {
  const request = event.data;
  try {
    const cv = await getOpenCv();
    if (request.type === "crop") {
      post({ type: "progress", progress: { stage: "preprocess", ratio: 0.1 } });
      post({ type: "crop", crop: detectUnitCrop(cv, request.imageData) });
      return;
    }
    post({ type: "progress", progress: { stage: "walls", ratio: 0.4 } });
    const { mask, ink, image, working } = buildWallMask(cv, request.imageData, request.crop, request.mmPerPx);
    // 어두운 갈색 가구도 벽 임계를 통과하므로, 두께는 검정 잉크로만 재고 잉크로 칠해진 세그먼트만 벽으로 남긴다
    const segments = filterInkSegments(extractWallSegments(mask, undefined, ink), ink, WALL_INK_MIN_RATIO);
    post({ type: "walls", result: { crop: request.crop, working, segments, mask, image } });
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
