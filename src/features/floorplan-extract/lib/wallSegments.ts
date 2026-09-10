import { MIN_WALL_RUN_PX, WALL_CROSS_SECTION_RATIO } from "../config/constants";
import type { MaskImage, WallSegmentPx } from "../model/types";

interface Run {
  line: number;
  start: number;
  end: number;
}

const isSet = (mask: MaskImage, x: number, y: number) => mask.data[y * mask.width + x] === 1;

function scanRuns(mask: MaskImage, horizontal: boolean, minLen: number): Run[] {
  const lines = horizontal ? mask.height : mask.width;
  const length = horizontal ? mask.width : mask.height;
  const runs: Run[] = [];
  for (let line = 0; line < lines; line++) {
    let start = -1;
    for (let pos = 0; pos <= length; pos++) {
      const on = pos < length && (horizontal ? isSet(mask, pos, line) : isSet(mask, line, pos));
      if (on && start < 0) start = pos;
      if (!on && start >= 0) {
        if (pos - start >= minLen) runs.push({ line, start, end: pos - 1 });
        start = -1;
      }
    }
  }
  return runs;
}

const overlaps = (a: Run, b: Run) => a.start <= b.end && b.start <= a.end;

/** 인접 라인의 겹치는 런을 묶어 두께를 가진 세그먼트로 만든다 */
function clusterRuns(runs: Run[]): { lines: number[]; start: number; end: number }[] {
  const clusters: { lines: number[]; start: number; end: number; lastRun: Run }[] = [];
  for (const run of runs) {
    const target = clusters.find((c) => c.lastRun.line === run.line - 1 && overlaps(c.lastRun, run));
    if (target) {
      target.lines.push(run.line);
      target.start = Math.min(target.start, run.start);
      target.end = Math.max(target.end, run.end);
      target.lastRun = run;
    } else {
      clusters.push({ lines: [run.line], start: run.start, end: run.end, lastRun: run });
    }
  }
  return clusters.map(({ lines, start, end }) => ({ lines, start, end }));
}

/**
 * 이진 벽 마스크에서 직교 벽 세그먼트를 추출한다.
 * 굵은 벽은 교차 축에서 짧은 런(단면)으로도 잡히므로 길이가 두께의 배수 이하인 런은 버린다.
 */
export function extractWallSegments(mask: MaskImage, minRunPx = MIN_WALL_RUN_PX): WallSegmentPx[] {
  const segments: WallSegmentPx[] = [];
  for (const horizontal of [true, false]) {
    for (const cluster of clusterRuns(scanRuns(mask, horizontal, minRunPx))) {
      const thickness = cluster.lines.length;
      const length = cluster.end - cluster.start + 1;
      const isCrossSection = length <= thickness * WALL_CROSS_SECTION_RATIO;
      if (isCrossSection) continue;
      const center = cluster.lines[Math.floor(cluster.lines.length / 2)];
      segments.push(
        horizontal
          ? { a: { x: cluster.start, y: center }, b: { x: cluster.end, y: center }, thicknessPx: thickness }
          : { a: { x: center, y: cluster.start }, b: { x: center, y: cluster.end }, thicknessPx: thickness }
      );
    }
  }
  return segments;
}
