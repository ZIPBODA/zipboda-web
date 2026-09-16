import type { PointPx } from "../model/types";

/** 픽셀이 영역에 속하는지 판단 */
export type RegionTest = (x: number, y: number) => boolean;

const key = (x: number, y: number) => `${x},${y}`;

/**
 * 영역의 바깥 윤곽을 직교 폴리곤으로 추적한다.
 * bbox로 방을 표현하면 ㄱ자·통로형 영역의 면적이 크게 부풀고 방끼리 겹친다.
 *
 * 방법: 영역 픽셀의 네 변 중 바깥과 맞닿은 변만 남기면 경계를 이루는 유향 에지 집합이 된다.
 * 이를 끝점→시작점으로 이어 붙이면 닫힌 고리가 나오고, 가장 긴 고리가 바깥 윤곽이다.
 * 좌표는 픽셀 모서리 기준이라 폴리곤이 픽셀 면적과 정확히 일치한다.
 */
export function traceRegionOutline(inRegion: RegionTest, minX: number, minY: number, maxX: number, maxY: number): PointPx[] {
  const edges = new Map<string, PointPx>();

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!inRegion(x, y)) continue;
      // 시계 방향(화면 좌표) 유향 에지 — 시작점에서 다음 에지를 찾아 이어 붙인다
      if (!inRegion(x, y - 1)) edges.set(key(x, y), { x: x + 1, y });
      if (!inRegion(x + 1, y)) edges.set(key(x + 1, y), { x: x + 1, y: y + 1 });
      if (!inRegion(x, y + 1)) edges.set(key(x + 1, y + 1), { x, y: y + 1 });
      if (!inRegion(x - 1, y)) edges.set(key(x, y + 1), { x, y });
    }
  }
  if (edges.size === 0) return [];

  const loops: PointPx[][] = [];
  const unused = new Map(edges);
  while (unused.size > 0) {
    const first = unused.keys().next().value;
    if (first === undefined) break;
    const loop: PointPx[] = [];
    let cursor = first;
    while (true) {
      const next = unused.get(cursor);
      if (next === undefined) break;
      unused.delete(cursor);
      const [cx, cy] = cursor.split(",").map(Number);
      loop.push({ x: cx, y: cy });
      cursor = key(next.x, next.y);
    }
    if (loop.length > 0) loops.push(loop);
  }

  const outer = loops.reduce((best, loop) => (loop.length > best.length ? loop : best), loops[0]);
  return dropCollinear(outer);
}

/** 같은 직선 위의 중간 점을 없애 꼭짓점만 남긴다 */
export function dropCollinear(points: PointPx[]): PointPx[] {
  if (points.length < 3) return points;
  const kept: PointPx[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const cur = points[i];
    const next = points[(i + 1) % points.length];
    const cross = (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x);
    if (cross !== 0) kept.push(cur);
  }
  return kept.length >= 3 ? kept : points;
}
