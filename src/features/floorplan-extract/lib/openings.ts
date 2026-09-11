import { WALL_LINE_GROUP_TOLERANCE_PX } from "../config/constants";
import type { PointPx, WallSegmentPx } from "../model/types";

/** 벽 시작점(a)에서 잰 개구부 구간(px) */
export interface OpeningSpanPx {
  startPx: number;
  endPx: number;
}

/** 개구부를 품은 하나의 연속 벽. 개구부로 끊긴 세그먼트들을 다시 이어 붙인 결과 */
export interface WallWithOpeningsPx {
  a: PointPx;
  b: PointPx;
  thicknessPx: number;
  openings: OpeningSpanPx[];
}

interface AxisSegment {
  start: number;
  end: number;
  line: number;
  thickness: number;
}

const isHorizontal = (s: WallSegmentPx) => Math.abs(s.a.y - s.b.y) <= Math.abs(s.a.x - s.b.x);

function toAxis(segment: WallSegmentPx, horizontal: boolean): AxisSegment {
  const along = horizontal ? [segment.a.x, segment.b.x] : [segment.a.y, segment.b.y];
  return {
    start: Math.min(along[0], along[1]),
    end: Math.max(along[0], along[1]),
    line: horizontal ? segment.a.y : segment.a.x,
    thickness: segment.thicknessPx
  };
}

/** 중심선이 tolerance 안에 드는 세그먼트끼리 같은 축선으로 묶는다 */
function groupByLine(segments: AxisSegment[], tolerancePx: number): AxisSegment[][] {
  const sorted = [...segments].sort((p, q) => p.line - q.line);
  const groups: AxisSegment[][] = [];
  for (const segment of sorted) {
    const last = groups[groups.length - 1];
    const sameLine = last !== undefined && Math.abs(segment.line - last[last.length - 1].line) <= tolerancePx;
    if (sameLine) last.push(segment);
    else groups.push([segment]);
  }
  return groups;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((p, q) => p - q);
  return sorted[Math.floor(sorted.length / 2)];
};

function buildWall(run: AxisSegment[], gaps: OpeningSpanPx[], horizontal: boolean): WallWithOpeningsPx {
  const start = run[0].start;
  const end = run[run.length - 1].end;
  const line = median(run.map((s) => s.line));
  return {
    a: horizontal ? { x: start, y: line } : { x: line, y: start },
    b: horizontal ? { x: end, y: line } : { x: line, y: end },
    thicknessPx: median(run.map((s) => s.thickness)),
    openings: gaps
  };
}

/**
 * 같은 축선 위에서 개구부 폭 범위의 빈 구간을 사이에 둔 벽 세그먼트를 하나의 벽으로 잇고,
 * 그 빈 구간을 개구부로 돌려준다. 범위를 벗어난 빈 구간은 서로 다른 벽으로 남긴다.
 * 문·창은 벽선을 끊으므로 런 스캔 결과에 그대로 빈 구간으로 나타난다.
 */
export function detectWallOpenings(
  segments: WallSegmentPx[],
  minGapPx: number,
  maxGapPx: number,
  lineTolerancePx = WALL_LINE_GROUP_TOLERANCE_PX
): WallWithOpeningsPx[] {
  const walls: WallWithOpeningsPx[] = [];

  for (const horizontal of [true, false]) {
    const axisSegments = segments.filter((s) => isHorizontal(s) === horizontal).map((s) => toAxis(s, horizontal));

    for (const group of groupByLine(axisSegments, lineTolerancePx)) {
      const ordered = [...group].sort((p, q) => p.start - q.start);
      let run: AxisSegment[] = [];
      let gaps: OpeningSpanPx[] = [];

      for (const segment of ordered) {
        const previous = run[run.length - 1];
        if (previous === undefined) {
          run = [segment];
          gaps = [];
          continue;
        }
        const gap = segment.start - previous.end - 1;
        if (gap <= 0) {
          // 겹치거나 맞닿음 — 같은 벽의 연장
          previous.end = Math.max(previous.end, segment.end);
          continue;
        }
        const isOpening = minGapPx <= gap && gap <= maxGapPx;
        if (isOpening) {
          gaps.push({ startPx: previous.end + 1 - run[0].start, endPx: segment.start - run[0].start });
          run.push(segment);
          continue;
        }
        walls.push(buildWall(run, gaps, horizontal));
        run = [segment];
        gaps = [];
      }

      if (run.length > 0) walls.push(buildWall(run, gaps, horizontal));
    }
  }

  return walls;
}
