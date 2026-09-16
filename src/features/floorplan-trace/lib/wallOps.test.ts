import { describe, it, expect } from "vitest";
import { validateOpenings, type FloorplanModel2D, type Wall2D } from "@/entities/floorplan";
import type { TraceOpening, TraceWall } from "../model/types";
import { healWallEndpoints, mergeWallsRemapOpenings, nearestWall, openEndpoints, projectOntoWall, reprojectOpenings } from "./wallOps";

const wall = (id: string, ax: number, az: number, bx: number, bz: number): TraceWall => ({ id, a: { x: ax, z: az }, b: { x: bx, z: bz } });

describe("projectOntoWall / nearestWall", () => {
  const w = wall("w1", 0, 0, 4000, 0);

  it("벽 밖의 점은 양 끝으로 잘린다", () => {
    expect(projectOntoWall(w, { x: -500, z: 10 })).toBe(0);
    expect(projectOntoWall(w, { x: 1200, z: 10 })).toBe(1200);
    expect(projectOntoWall(w, { x: 9000, z: 10 })).toBe(4000);
  });

  it("허용치 안에서 가장 가까운 벽을 찾는다", () => {
    const far = wall("w2", 0, 3000, 4000, 3000);
    expect(nearestWall([w, far], { x: 1000, z: 60 }, 100)?.wall.id).toBe("w1");
    expect(nearestWall([w, far], { x: 1000, z: 1500 }, 100)).toBeNull();
  });
});

describe("healWallEndpoints", () => {
  it("40mm 모자란 칸막이 끝점을 외벽 위로 늘린다", () => {
    const outer = wall("w1", 0, 0, 0, 3000);
    const divider = wall("w2", 40, 1000, 2500, 1000);
    const healed = healWallEndpoints([outer, divider], 100);
    expect(healed[1].a).toEqual({ x: 0, z: 1000 });
    expect(healed[1].b).toEqual({ x: 2500, z: 1000 });
  });

  it("허용치 밖(300mm)이면 건드리지 않고, 허용치와 같은 거리는 붙인다", () => {
    const outer = wall("w1", 0, 0, 0, 3000);
    expect(healWallEndpoints([outer, wall("w2", 300, 1000, 2500, 1000)], 100)[1].a).toEqual({ x: 300, z: 1000 });
    expect(healWallEndpoints([outer, wall("w2", 100, 1000, 2500, 1000)], 100)[1].a).toEqual({ x: 0, z: 1000 });
  });

  it("살짝 지나친 끝점은 되돌려 붙인다", () => {
    const outer = wall("w1", 0, 0, 0, 3000);
    const divider = wall("w2", -30, 1000, 2500, 1000);
    expect(healWallEndpoints([outer, divider], 100)[1].a).toEqual({ x: 0, z: 1000 });
  });
});

describe("openEndpoints", () => {
  it("닫힌 사각형은 열린 끝점이 없다", () => {
    const box = [wall("a", 0, 0, 4000, 0), wall("b", 4000, 0, 4000, 3000), wall("c", 0, 3000, 4000, 3000), wall("d", 0, 0, 0, 3000)];
    expect(openEndpoints(box)).toEqual([]);
  });

  it("한 변이 빠지면 양쪽 끝점 두 개가 열린다", () => {
    const open = [wall("a", 0, 0, 4000, 0), wall("b", 4000, 0, 4000, 3000), wall("d", 0, 0, 0, 3000)];
    expect(openEndpoints(open)).toEqual([
      { x: 4000, z: 3000 },
      { x: 0, z: 3000 }
    ]);
  });
});

describe("reprojectOpenings", () => {
  const before = wall("w1", 0, 0, 4000, 0);
  const openings: TraceOpening[] = [{ id: "o1", wallId: "w1", type: "door", offsetMm: 1000, widthMm: 900 }];

  it("a가 안쪽으로 움직여도 문은 도면 위 같은 자리에 남는다", () => {
    const after = wall("w1", 500, 0, 4000, 0);
    expect(reprojectOpenings(openings, before, after)).toEqual([{ ...openings[0], offsetMm: 500 }]);
  });

  it("벽이 문 위치보다 짧아지면 문을 버린다", () => {
    const after = wall("w1", 1500, 0, 4000, 0);
    expect(reprojectOpenings(openings, before, after)).toEqual([]);
  });

  it("다른 벽의 개구부는 그대로 둔다", () => {
    const other: TraceOpening = { id: "o2", wallId: "w9", type: "window", offsetMm: 0, widthMm: 500 };
    expect(reprojectOpenings([other], before, wall("w1", 500, 0, 4000, 0))).toEqual([other]);
  });
});

describe("mergeWallsRemapOpenings", () => {
  const toWall2D = (w: TraceWall, exterior = false): Wall2D => ({ ...w, thicknessMm: 100, exterior });

  it("맞닿은 두 벽을 합치고 둘째 벽의 문 offset을 첫 벽 기준으로 옮긴다", () => {
    const walls = [toWall2D(wall("w1", 0, 0, 2000, 0)), toWall2D(wall("w2", 2000, 0, 5000, 0), true)];
    const openings: TraceOpening[] = [{ id: "o1", wallId: "w2", type: "door", offsetMm: 500, widthMm: 900 }];
    const merged = mergeWallsRemapOpenings(walls, openings);
    expect(merged.walls).toEqual([{ id: "w1", a: { x: 0, z: 0 }, b: { x: 5000, z: 0 }, thicknessMm: 100, exterior: true }]);
    expect(merged.openings).toEqual([{ wallId: "w1", type: "door", offsetMm: 2500, widthMm: 900 }]);

    const model = { walls: merged.walls, openings: merged.openings } as FloorplanModel2D;
    expect(validateOpenings(model)).toEqual([]);
  });

  it("떨어진 벽은 합치지 않는다", () => {
    const walls = [toWall2D(wall("w1", 0, 0, 2000, 0)), toWall2D(wall("w2", 2600, 0, 5000, 0))];
    expect(mergeWallsRemapOpenings(walls, []).walls).toHaveLength(2);
  });

  it("다른 축선의 벽은 따로 둔다", () => {
    const walls = [toWall2D(wall("w1", 0, 0, 2000, 0)), toWall2D(wall("w2", 0, 500, 2000, 500))];
    expect(mergeWallsRemapOpenings(walls, []).walls).toHaveLength(2);
  });
});
