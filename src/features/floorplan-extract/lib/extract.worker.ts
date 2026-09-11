/// <reference lib="webworker" />

import type { GeometryWorkerRequest, GeometryWorkerResponse } from "../model/types";
import { getOpenCv } from "./opencv";
import { buildWallMask } from "./wallMask";
import { extractWallSegments } from "./wallSegments";
import { sealMaskBorder, sealWallGaps } from "./openings";
import { colorBoundaryMask, unionMask } from "./colorBoundary";
import { COLOR_BLOCK_PX, COLOR_BOUNDARY_THRESHOLD, SEAL_GAP_RATIO } from "../config/constants";
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
    // 문·창이 열려 있으면 플러드필이 방 사이로 새어 방이 하나로 뭉친다 — 사본에서만 틈을 메워 분할한다
    const sealed = sealMaskBorder(sealWallGaps(mask, segments, Math.round(Math.min(mask.width, mask.height) * SEAL_GAP_RATIO)));
    // 벽 없이 바닥 마감재만 바뀌는 경계(주방↔거실 등)를 더한다. 벽 검출 결과는 건드리지 않는다
    const colorEdges = colorBoundaryMask(event.data.imageData, crop, COLOR_BLOCK_PX, COLOR_BOUNDARY_THRESHOLD);
    const regions = interiorRegions(findRoomRegions(unionMask(sealed, colorEdges)));

    post({ type: "geometry", result: { crop, segments, regions } });
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
