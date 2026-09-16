import { MIN_WALL_RUN_PX, WALL_CROSS_SECTION_RATIO, WALL_PROFILE_TOLERANCE_RATIO } from "../config/constants";
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

/** 인접 라인의 겹치는 런을 묶는다. 런을 그대로 보존해 위치별 두께를 다시 셀 수 있게 한다 */
function clusterRuns(runs: Run[]): Run[][] {
  const clusters: Run[][] = [];
  for (const run of runs) {
    const target = clusters.find((cluster) => {
      const last = cluster[cluster.length - 1];
      return last.line === run.line - 1 && overlaps(last, run);
    });
    if (target) target.push(run);
    else clusters.push([run]);
  }
  return clusters;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((p, q) => p - q);
  return sorted[Math.floor(sorted.length / 2)];
};

interface Interval {
  from: number;
  to: number;
  thickness: number;
  center: number;
}

/**
 * 클러스터를 벽 방향으로 훑으며 위치별 두께(그 위치를 덮는 잉크 라인 수)가 안정된 구간으로 쪼갠다.
 * 벽에 붙어 그려진 PS 상자·주방가구·냉장고는 어두워서 같은 클러스터에 들어오지만 검정 잉크가 아니다.
 * 잉크 라인만 세면 벽 두께·중심선이 가구에 흔들리지 않고, 잉크가 없는 위치는 벽이 아니다.
 * (클러스터 전체 라인 수를 두께로 쓰면 외벽+주방가구가 552mm 한 벽으로 뭉쳤다가 잉크 비율에서 통째로 탈락한다)
 */
function splitByThickness(cluster: Run[], toleranceRatio: number, isInk: (line: number, pos: number) => boolean): Interval[] {
  const start = Math.min(...cluster.map((run) => run.start));
  const end = Math.max(...cluster.map((run) => run.end));
  const thicknessAt: number[] = [];
  const centerAt: number[] = [];
  for (let pos = start; pos <= end; pos++) {
    const covering = cluster
      .filter((run) => run.start <= pos && pos <= run.end && isInk(run.line, pos))
      .map((run) => run.line);
    thicknessAt.push(covering.length);
    centerAt.push(covering.length > 0 ? median(covering) : -1);
  }

  const intervals: Interval[] = [];
  let i = 0;
  while (i < thicknessAt.length) {
    if (thicknessAt[i] === 0) {
      i++;
      continue;
    }
    const seen: number[] = [];
    let j = i;
    while (j < thicknessAt.length && thicknessAt[j] > 0) {
      const runningMedian = median([...seen, thicknessAt[j]]);
      const isStable = seen.length === 0 || Math.abs(thicknessAt[j] - runningMedian) <= Math.max(1, runningMedian * toleranceRatio);
      if (!isStable) break;
      seen.push(thicknessAt[j]);
      j++;
    }
    intervals.push({
      from: start + i,
      to: start + j - 1,
      thickness: median(seen),
      center: median(centerAt.slice(i, j).filter((c) => c >= 0))
    });
    i = j;
  }
  return intervals;
}

/**
 * 이진 벽 마스크에서 직교 벽 세그먼트를 추출한다.
 * 굵은 벽은 교차 축에서 짧은 런(단면)으로도 잡히므로 길이가 두께의 배수 이하인 런은 버린다.
 * ink를 주면 두께·중심선을 검정 잉크 픽셀로만 잰다(어두운 갈색 가구가 벽에 붙어 있어도 벽만 남는다).
 */
export function extractWallSegments(mask: MaskImage, minRunPx = MIN_WALL_RUN_PX, ink?: MaskImage): WallSegmentPx[] {
  const segments: WallSegmentPx[] = [];
  for (const horizontal of [true, false]) {
    const isInk = (line: number, pos: number) => ink === undefined || isSet(ink, horizontal ? pos : line, horizontal ? line : pos);
    for (const cluster of clusterRuns(scanRuns(mask, horizontal, minRunPx))) {
      for (const { from, to, thickness, center } of splitByThickness(cluster, WALL_PROFILE_TOLERANCE_RATIO, isInk)) {
        const length = to - from + 1;
        const isCrossSection = length <= thickness * WALL_CROSS_SECTION_RATIO;
        if (length < minRunPx || isCrossSection) continue;
        segments.push(
          horizontal
            ? { a: { x: from, y: center }, b: { x: to, y: center }, thicknessPx: thickness }
            : { a: { x: center, y: from }, b: { x: center, y: to }, thicknessPx: thickness }
        );
      }
    }
  }
  return segments;
}

/** 세그먼트 몸통 픽셀 중 잉크 마스크에 켜진 비율 */
export function inkRatio(segment: WallSegmentPx, ink: MaskImage): number {
  const horizontal = Math.abs(segment.a.y - segment.b.y) <= Math.abs(segment.a.x - segment.b.x);
  const half = Math.floor(segment.thicknessPx / 2);
  const line = horizontal ? segment.a.y : segment.a.x;
  const from = horizontal ? Math.min(segment.a.x, segment.b.x) : Math.min(segment.a.y, segment.b.y);
  const to = horizontal ? Math.max(segment.a.x, segment.b.x) : Math.max(segment.a.y, segment.b.y);
  let total = 0;
  let on = 0;
  for (let pos = from; pos <= to; pos++) {
    for (let offset = -half; offset <= half; offset++) {
      const x = horizontal ? pos : line + offset;
      const y = horizontal ? line + offset : pos;
      if (x < 0 || y < 0 || x >= ink.width || y >= ink.height) continue;
      total++;
      if (isSet(ink, x, y)) on++;
    }
  }
  return total === 0 ? 0 : on / total;
}

/**
 * 검정 잉크로 인쇄된 세그먼트만 남긴다.
 * 도면에서 벽은 검정(gray≈60)으로, 주방가구·침대·신발장은 갈색·회색(gray≈100~200)으로 채워진다.
 * 어두운 갈색은 벽 임계(128)를 통과하고 두께도 벽과 겹치므로 색으로만 갈린다.
 */
export function filterInkSegments(segments: WallSegmentPx[], ink: MaskImage, minRatio: number): WallSegmentPx[] {
  return segments.filter((segment) => inkRatio(segment, ink) >= minRatio);
}
