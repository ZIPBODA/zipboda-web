/// <reference lib="webworker" />

import type { GeometryWorkerRequest, GeometryWorkerResponse } from "../model/types";
import { getOpenCv } from "./opencv";
import { buildWallMask } from "./wallMask";
import { extractWallSegments } from "./wallSegments";
import { findRoomRegions, interiorRegions } from "./roomRegions";

const post = (message: GeometryWorkerResponse) => self.postMessage(message);

self.onmessage = async (event: MessageEvent<GeometryWorkerRequest>) => {
  if (event.data.type !== "geometry") return;
  try {
    post({ type: "progress", progress: { stage: "preprocess", ratio: 0.1 } });
    const cv = await getOpenCv();
    const { mask, crop } = buildWallMask(cv, event.data.imageData);

    post({ type: "progress", progress: { stage: "walls", ratio: 0.4 } });
    const segments = extractWallSegments(mask);

    post({ type: "progress", progress: { stage: "rooms", ratio: 0.7 } });
    const regions = interiorRegions(findRoomRegions(mask));

    post({ type: "geometry", result: { crop, segments, regions } });
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
