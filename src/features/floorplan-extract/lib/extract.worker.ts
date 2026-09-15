/// <reference lib="webworker" />

import type { GeometryWorkerRequest, GeometryWorkerResponse } from "../model/types";
import { getOpenCv } from "./opencv";
import { buildWallMask } from "./wallMask";
import { extractWallSegments } from "./wallSegments";
import { sealMaskBorder, sealWallGaps } from "./openings";
import { colorBoundaryMask, unionMask } from "./colorBoundary";
import { erodeMask, openMask, subtractMask } from "./maskOps";
import {
  COLOR_BLOCK_PX,
  COLOR_BOUNDARY_MIN_RUN_RATIO,
  COLOR_BOUNDARY_THRESHOLD,
  SEAL_GAP_RATIO,
  THICK_GRAPHIC_RATIO,
  WALL_ERODE_MAX_PX,
  WALL_ERODE_RATIO
} from "../config/constants";
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
    // 방 면적을 벽 중심선 기준으로 맞추려고 벽을 절반 깎는다(인쇄 면적과 기준을 맞춘다)
    const thicknesses = segments.map((s) => s.thicknessPx).sort((a, b) => a - b);
    const medianThickness = thicknesses.length > 0 ? thicknesses[Math.floor(thicknesses.length / 2)] : 0;
    // 난간·창처럼 굵게 칠해진 그림은 벽이 아니다 — 방 분할용 마스크에서만 걷어내 방 면적을 돌려준다
    const graphicRadius = Math.max(1, Math.round((medianThickness * THICK_GRAPHIC_RATIO) / 2));
    const cleaned = subtractMask(mask, openMask(mask, graphicRadius));

    // 얇은 내벽이 사라져 방이 합쳐지지 않도록 절반의 절반만 깎는다
    const erodeRadius = Math.min(WALL_ERODE_MAX_PX, Math.floor((medianThickness * WALL_ERODE_RATIO) / 2));
    const slim = erodeMask(cleaned, erodeRadius);

    // 문·창이 열려 있으면 플러드필이 방 사이로 새어 방이 하나로 뭉친다 — 사본에서만 틈을 메워 분할한다
    const sealed = sealMaskBorder(sealWallGaps(slim, segments, Math.round(Math.min(mask.width, mask.height) * SEAL_GAP_RATIO)));
    // 벽 없이 바닥 마감재만 바뀌는 경계(주방↔거실 등)를 더한다. 벽 검출 결과는 건드리지 않는다
    const colorEdges = colorBoundaryMask(event.data.imageData, crop, COLOR_BLOCK_PX, COLOR_BOUNDARY_THRESHOLD, COLOR_BOUNDARY_MIN_RUN_RATIO);
    const regions = interiorRegions(findRoomRegions(unionMask(sealed, colorEdges)));

    post({ type: "geometry", result: { crop, segments, regions } });
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
