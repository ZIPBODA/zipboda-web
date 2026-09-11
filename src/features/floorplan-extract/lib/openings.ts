import { WALL_LINE_GROUP_TOLERANCE_PX } from "../config/constants";
import type { MaskImage, PointPx, WallSegmentPx } from "../model/types";

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
 * 벽의 가까운 면이 경계에 닿으면 외벽으로 본다.
 * 세그먼트는 중심선으로 나오므로 중심만 비교하면 두꺼운 외벽이 내벽으로 오판된다.
 */
export function wallTouchesEdge(line: number, thicknessPx: number, extent: number, tolerancePx: number): boolean {
  const half = thicknessPx / 2;
  return line - half <= tolerancePx || extent - 1 - (line + half) <= tolerancePx;
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

/**
 * 방 분할용으로 벽의 빈 구간(문·창)을 메운 마스크를 만든다.
 * 틈이 열려 있으면 플러드필이 방 사이로 새어 나가 방이 하나로 뭉친다.
 * 외벽(건물 외피)은 발코니 창처럼 큰 개구부라도 닫아야 바깥으로 새지 않으므로 틈 크기를 따지지 않는다.
 * 원본 마스크는 그대로 두고 사본에만 그린다(벽 세그먼트 추출 결과는 틈이 있어야 개구부를 찾는다).
 */
export function sealWallGaps(
  mask: MaskImage,
  segments: WallSegmentPx[],
  maxGapPx: number,
  edgeTolerancePx = 2
): MaskImage {
  const sealed: MaskImage = { data: Uint8Array.from(mask.data), width: mask.width, height: mask.height };
  const paint = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= sealed.width || y >= sealed.height) return;
    sealed.data[y * sealed.width + x] = 1;
  };

  const onEdge = (segment: WallSegmentPx) => {
    const horizontal = isHorizontal(segment);
    const line = horizontal ? segment.a.y : segment.a.x;
    const extent = horizontal ? mask.height : mask.width;
    return wallTouchesEdge(line, segment.thicknessPx, extent, edgeTolerancePx);
  };

  const seal = (group: WallSegmentPx[], gapLimit: number) => {
    for (const wall of detectWallOpenings(group, 1, gapLimit)) {
      const horizontal = Math.abs(wall.a.y - wall.b.y) <= Math.abs(wall.a.x - wall.b.x);
      const line = horizontal ? wall.a.y : wall.a.x;
      const from = horizontal ? Math.min(wall.a.x, wall.b.x) : Math.min(wall.a.y, wall.b.y);
      const half = Math.max(1, Math.floor(wall.thicknessPx / 2));
      for (const span of wall.openings) {
        for (let along = from + span.startPx; along <= from + span.endPx; along++) {
          for (let offset = -half; offset <= half; offset++) {
            if (horizontal) paint(along, line + offset);
            else paint(line + offset, along);
          }
        }
      }
    }
  };

  seal(segments.filter((s) => !onEdge(s)), maxGapPx);
  seal(segments.filter(onEdge), Number.POSITIVE_INFINITY);

  return sealed;
}

/**
 * 마스크 테두리를 벽으로 막는다.
 * 크롭은 유닛 벽의 실제 범위라 테두리 = 건물 외피다. 벽 검출이 일부 누락되면
 * 그 구멍으로 플러드필이 빠져나가 실내 전체가 '바깥'으로 묶이므로, 경계를 닫아 막는다.
 */
export function sealMaskBorder(mask: MaskImage): MaskImage {
  const sealed: MaskImage = { data: Uint8Array.from(mask.data), width: mask.width, height: mask.height };
  const { width, height } = sealed;
  for (let x = 0; x < width; x++) {
    sealed.data[x] = 1;
    sealed.data[(height - 1) * width + x] = 1;
  }
  for (let y = 0; y < height; y++) {
    sealed.data[y * width] = 1;
    sealed.data[y * width + width - 1] = 1;
  }
  return sealed;
}
